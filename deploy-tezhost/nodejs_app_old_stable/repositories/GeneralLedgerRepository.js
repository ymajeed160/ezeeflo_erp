const BaseRepository = require('./BaseRepository');
const { Account, JournalEntry, JournalEntryLine } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * GeneralLedgerRepository
 *
 * Purpose:
 *   Dynamically generates General Ledger data from Posted Journal Entries
 *   and Journal Entry Details. No separate GL table is used.
 *
 * Source Tables:
 *   - accounts
 *   - journal_entries (status = 'posted' only)
 *   - journal_entry_lines
 *
 * Key Methods:
 *   - getLedgerAccounts()        Fetch accounts matching filters
 *   - getAccountHierarchy()      Recursively resolve parent → children accounts
 *   - getGeneralLedger()         Fetch posted transactions with pagination
 *   - calculateOpeningBalance()  Sum all posted transactions before dateFrom
 *   - calculateClosingBalance()  Opening + sum of period transactions
 */
class GeneralLedgerRepository extends BaseRepository {
  constructor() {
    // BaseRepository expects a model; we use Account as the primary model
    // but this repository primarily composes across multiple models.
    super(Account);
  }

  // ---------------------------------------------------------------------------
  // 1. Get Ledger Accounts
  //    Return accounts available for GL filtering, optionally filtered by type.
  // ---------------------------------------------------------------------------
  async getLedgerAccounts(tenantId, filters = {}) {
    try {
      const where = { tenantId, isActive: true };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.parentAccountId !== undefined) {
        where.parentAccountId = filters.parentAccountId || null;
      }

      const accounts = await Account.findAll({
        where,
        attributes: ['id', 'code', 'name', 'type', 'parentAccountId'],
        order: [['code', 'ASC']],
      });

      return accounts;
    } catch (error) {
      logger.error('GeneralLedgerRepository getLedgerAccounts error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Get Account Hierarchy
  //    Given a parent account ID, recursively collect all descendant account IDs.
  //    This allows "drill-down" from a parent account (e.g. "Assets") to see
  //    all child account transactions.
  // ---------------------------------------------------------------------------
  async getAccountHierarchy(accountId, tenantId) {
    try {
      const childIds = [];

      /**
       * Recursive helper to find all children of a given account.
       * Uses an iterative breadth-first approach to avoid stack overflow
       * on deeply nested charts of accounts.
       */
      const queue = [accountId];

      while (queue.length > 0) {
        const currentId = queue.shift();

        const children = await Account.findAll({
          where: {
            tenantId,
            parentAccountId: currentId,
            isActive: true,
          },
          attributes: ['id'],
        });

        for (const child of children) {
          const childId = child.id;
          if (!childIds.includes(childId)) {
            childIds.push(childId);
            queue.push(childId);
          }
        }
      }

      // Include the parent account itself
      const allIds = [accountId, ...childIds];

      logger.info(
        `Account hierarchy resolved for ${accountId}: ${allIds.length} accounts (1 parent + ${childIds.length} children)`
      );

      return allIds;
    } catch (error) {
      logger.error('GeneralLedgerRepository getAccountHierarchy error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Get General Ledger
  //    Fetch all posted journal entry lines for the given account(s) within the
  //    date range. Returns paginated data with joined JournalEntry header info.
  // ---------------------------------------------------------------------------
  async getGeneralLedger(tenantId, { accountIds, dateFrom, dateTo, page = 1, limit = 50, journalNumber, referenceNumber, accountType } = {}) {
    try {
      if (!accountIds || accountIds.length === 0) {
        return {
          rows: [],
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const whereConditions = {
        tenantId,
        accountId: { [Op.in]: accountIds },
      };

      // Join to journal_entries and filter only posted entries
      // We use include with required: true to enforce inner join
      const journalEntryWhere = {
        tenantId,
        status: 'posted',
      };

      if (dateFrom || dateTo) {
        journalEntryWhere.entryDate = {};
        if (dateFrom) journalEntryWhere.entryDate[Op.gte] = dateFrom;
        if (dateTo) journalEntryWhere.entryDate[Op.lte] = dateTo;
      }

      if (journalNumber) {
        journalEntryWhere.entryNumber = { [Op.like]: `%${journalNumber}%` };
      }

      if (referenceNumber) {
        journalEntryWhere.reference = { [Op.like]: `%${referenceNumber}%` };
      }

      const result = await JournalEntryLine.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: JournalEntry,
            where: journalEntryWhere,
            required: true,
            attributes: ['id', 'entryNumber', 'entryDate', 'reference', 'description', 'status', 'postedAt'],
          },
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'code', 'name', 'type'],
            ...(accountType ? { where: { type: accountType } } : {}),
          },
        ],
        order: [
          [{ model: JournalEntry }, 'entryDate', 'ASC'],
          [{ model: JournalEntry }, 'entryNumber', 'ASC'],
          ['lineNumber', 'ASC'],
        ],
        limit,
        offset,
        distinct: true,
        // Use raw subQuery to handle the joined distinct count correctly
        subQuery: false,
      });

      return {
        rows: result.rows,
        count: result.count.length !== undefined
          ? result.count.length
          : result.count,
        pagination: {
          page,
          limit,
          total: result.count.length !== undefined
            ? result.count.length
            : result.count,
          totalPages: Math.ceil(
            (result.count.length !== undefined ? result.count.length : result.count) / limit
          ),
          hasNext:
            page * limit <
            (result.count.length !== undefined ? result.count.length : result.count),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('GeneralLedgerRepository getGeneralLedger error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Calculate Opening Balance
  //    Sum all posted journal entry lines BEFORE dateFrom for the given accounts.
  //    Separates debit and credit totals so the Service can apply the correct
  //    formula per account type.
  // ---------------------------------------------------------------------------
  async calculateOpeningBalance(tenantId, { accountIds, dateFrom, accountType }) {
    try {
      if (!accountIds || accountIds.length === 0) {
        return { totalDebit: 0, totalCredit: 0 };
      }

      // For opening balance, we need all posted transactions BEFORE dateFrom
      const journalEntryWhere = {
        tenantId,
        status: 'posted',
      };

      if (dateFrom) {
        journalEntryWhere.entryDate = { [Op.lt]: dateFrom };
      } else {
        // If no dateFrom, opening balance is 0 (everything is in range)
        return { totalDebit: 0, totalCredit: 0 };
      }

      // Build includes array
      const includes = [
        {
          model: JournalEntry,
          where: journalEntryWhere,
          required: true,
          attributes: [],
        },
      ];

      // Add Account include filter when accountType is specified
      if (accountType) {
        includes.push({
          model: Account,
          as: 'account',
          where: { type: accountType },
          required: true,
          attributes: [],
        });
      }

      const result = await JournalEntryLine.findAll({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('credit')), 0), 'totalCredit'],
        ],
        where: {
          tenantId,
          accountId: { [Op.in]: accountIds },
        },
        include: includes,
        raw: true,
      });

      const totalDebit = parseFloat(result[0]?.totalDebit || 0);
      const totalCredit = parseFloat(result[0]?.totalCredit || 0);

      return { totalDebit, totalCredit };
    } catch (error) {
      logger.error('GeneralLedgerRepository calculateOpeningBalance error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Calculate Closing Balance
  //    Opening Balance + All posted transactions within the date range.
  //    Same as opening balance but includes the filtered period.
  // ---------------------------------------------------------------------------
  async calculateClosingBalance(tenantId, { accountIds, dateFrom, dateTo }) {
    try {
      if (!accountIds || accountIds.length === 0) {
        return { totalDebit: 0, totalCredit: 0 };
      }

      const journalEntryWhere = {
        tenantId,
        status: 'posted',
      };

      if (dateFrom || dateTo) {
        journalEntryWhere.entryDate = {};
        if (dateFrom) journalEntryWhere.entryDate[Op.gte] = dateFrom;
        if (dateTo) journalEntryWhere.entryDate[Op.lte] = dateTo;
      }

      const result = await JournalEntryLine.findAll({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('credit')), 0), 'totalCredit'],
        ],
        where: {
          tenantId,
          accountId: { [Op.in]: accountIds },
        },
        include: [
          {
            model: JournalEntry,
            where: journalEntryWhere,
            required: true,
            attributes: [],
          },
        ],
        raw: true,
      });

      const totalDebit = parseFloat(result[0]?.totalDebit || 0);
      const totalCredit = parseFloat(result[0]?.totalCredit || 0);

      // Closing = Opening Balance debits/credits + period debits/credits
      const opening = await this.calculateOpeningBalance(tenantId, { accountIds, dateFrom });

      return {
        totalDebit: opening.totalDebit + totalDebit,
        totalCredit: opening.totalCredit + totalCredit,
      };
    } catch (error) {
      logger.error('GeneralLedgerRepository calculateClosingBalance error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Get Aggregate Debit/Credit for Period (used for summary section)
  // ---------------------------------------------------------------------------
  async getPeriodAggregates(tenantId, { accountIds, dateFrom, dateTo, journalNumber, referenceNumber } = {}) {
    try {
      if (!accountIds || accountIds.length === 0) {
        return { totalDebit: 0, totalCredit: 0 };
      }

      const journalEntryWhere = {
        tenantId,
        status: 'posted',
      };

      if (dateFrom || dateTo) {
        journalEntryWhere.entryDate = {};
        if (dateFrom) journalEntryWhere.entryDate[Op.gte] = dateFrom;
        if (dateTo) journalEntryWhere.entryDate[Op.lte] = dateTo;
      }

      if (journalNumber) {
        journalEntryWhere.entryNumber = { [Op.like]: `%${journalNumber}%` };
      }

      if (referenceNumber) {
        journalEntryWhere.reference = { [Op.like]: `%${referenceNumber}%` };
      }

      const result = await JournalEntryLine.findAll({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('credit')), 0), 'totalCredit'],
        ],
        where: {
          tenantId,
          accountId: { [Op.in]: accountIds },
        },
        include: [
          {
            model: JournalEntry,
            where: journalEntryWhere,
            required: true,
            attributes: [],
          },
        ],
        raw: true,
      });

      return {
        totalDebit: parseFloat(result[0]?.totalDebit || 0),
        totalCredit: parseFloat(result[0]?.totalCredit || 0),
      };
    } catch (error) {
      logger.error('GeneralLedgerRepository getPeriodAggregates error:', { error: error.message });
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Helper: Fetch a single account by ID (with tenant scope)
  // ---------------------------------------------------------------------------
  async getAccountById(accountId, tenantId) {
    return await Account.findOne({
      where: { id: accountId, tenantId },
      attributes: ['id', 'code', 'name', 'type', 'parentAccountId'],
    });
  }
}

module.exports = new GeneralLedgerRepository();