'use strict';

const GeneralLedgerRepository = require('../repositories/GeneralLedgerRepository');
const { GeneralLedgerDTO } = require('../dto/GeneralLedgerDTO');

class GeneralLedgerService {
  /**
   * Get the full general ledger for the given tenant and filters.
   *
   * Called from the controller with signature:
   *   getGeneralLedger(tenantId, filters, pagination)
   *
   * @param {string} tenantId                    - Required tenant ID
   * @param {Object} filters
   * @param {string} [filters.accountId]         - Optional single account; if parent, children are included
   * @param {string} [filters.dateFrom]          - ISO date string (YYYY-MM-DD)
   * @param {string} [filters.dateTo]            - ISO date string (YYYY-MM-DD)
   * @param {string} [filters.accountType]       - asset | liability | equity | revenue | expense
   * @param {string} [filters.journalNumber]     - Partial / full journal number
   * @param {string} [filters.referenceNumber]   - Partial / full reference number
   * @param {Object} pagination
   * @param {number} [pagination.page]           - 1-based page (default 1)
   * @param {number} [pagination.limit]          - records per page (default 50)
   * @returns {Promise<Object>} Ledger response payload
   */
  async getGeneralLedger(tenantId, filters = {}, pagination = {}) {
    if (!tenantId) throw new Error('Tenant ID is required');

    const { accountId, dateFrom, dateTo, accountType, journalNumber, referenceNumber } = filters;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 50;

    // Resolve which accounts to include:
    // 1. If accountId is provided, get it + all children (hierarchy drill-down)
    // 2. Else if accountType is provided, get all accounts of that type
    // 3. Else (no filters), get ALL active accounts
    let accountIds = null;
    let selectedAccount = null;
    if (accountId) {
      accountIds = await GeneralLedgerRepository.getAccountHierarchy(accountId, tenantId);
      selectedAccount = await GeneralLedgerRepository.getAccountById(accountId, tenantId);
    } else if (accountType) {
      const typeAccounts = await GeneralLedgerRepository.getLedgerAccounts(tenantId, { type: accountType });
      accountIds = typeAccounts.map((a) => a.id);
      if (accountIds.length === 0) accountIds = null;
    } else {
      // "All Types" — fetch all active accounts
      const allAccounts = await GeneralLedgerRepository.getLedgerAccounts(tenantId);
      accountIds = allAccounts.map((a) => a.id);
      if (accountIds.length === 0) accountIds = null;
    }

    // ---- Build the filter object for repository calls ----
    const repoFilters = { accountIds, dateFrom, dateTo, accountType, journalNumber, referenceNumber };

    // 1. Calculate opening balance = sum of all posted entries before dateFrom
    const openingBal = await GeneralLedgerRepository.calculateOpeningBalance(
      tenantId,
      { accountIds, dateFrom, accountType }
    );

    // Determine the opening balance net value based on account type
    const openingBalanceNet = this._computeNetBalance(
      openingBal.totalDebit,
      openingBal.totalCredit,
      selectedAccount ? selectedAccount.type : accountType
    );

    // 2. Get the paginated transactions within the date range
    const { rows: rawTransactions, count, pagination: paginationMeta } =
      await GeneralLedgerRepository.getGeneralLedger(
        tenantId,
        { ...repoFilters, page, limit }
      );

    // 3. Compute running balances and format transactions
    let runningBalance = openingBalanceNet;
    const transactions = rawTransactions.map((row) => {
      const plain = row.toJSON ? row.toJSON() : row;

      // Extract values from the joined models
      const journalEntry = plain.JournalEntry || {};
      const account = plain.account || plain.Account || {};

      const entryDate = journalEntry.entryDate || plain.entryDate || null;
      const entryNumber = journalEntry.entryNumber || plain.entryNumber || null;
      const reference = journalEntry.reference || plain.reference || null;
      const description = plain.description || journalEntry.description || null;
      const acctType = account.type || plain.accountType || accountType || 'asset';
      const acctCode = account.code || plain.accountCode || null;
      const acctName = account.name || plain.accountName || null;

      const debit = parseFloat(plain.debit || 0);
      const credit = parseFloat(plain.credit || 0);

      // For Asset & Expense: Balance = Prev + Debit - Credit
      // For Liability, Equity & Revenue: Balance = Prev - Debit + Credit
      const isAssetOrExpense = acctType === 'asset' || acctType === 'expense';
      if (isAssetOrExpense) {
        runningBalance = runningBalance + debit - credit;
      } else {
        runningBalance = runningBalance - debit + credit;
      }

      return {
        transactionDate: entryDate,
        journalNumber: entryNumber,
        referenceNumber: reference,
        description,
        accountName: acctName,
        accountCode: acctCode,
        accountType: acctType,
        debit,
        credit,
        runningBalance: parseFloat(runningBalance.toFixed(2)),
      };
    });

    // 4. Compute summary totals
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
    const closingBalance = transactions.length > 0
      ? parseFloat(transactions[transactions.length - 1].runningBalance.toFixed(2))
      : openingBalanceNet;

    // 5. Return via DTO
    return GeneralLedgerDTO.toResponse({
      account: selectedAccount,
      openingBalance: parseFloat(openingBalanceNet.toFixed(2)),
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      transactions,
      pagination: paginationMeta
        ? { ...paginationMeta, total: count, page, limit }
        : { page, limit, total: transactions.length, totalPages: 1 },
    });
  }

  /**
   * Compute the net opening balance for account type.
   * Asset/Expense: Debit - Credit
   * Liability/Equity/Revenue: Credit - Debit
   */
  _computeNetBalance(totalDebit, totalCredit, accountType) {
    const isAssetOrExpense = accountType === 'asset' || accountType === 'expense';
    if (isAssetOrExpense) {
      return parseFloat(totalDebit) - parseFloat(totalCredit);
    }
    return parseFloat(totalCredit) - parseFloat(totalDebit);
  }

  /**
   * Get a flat list of accounts suitable for the ledger filter dropdown.
   * Returns accounts with hierarchy metadata for indented display.
   *
   * @param {string} tenantId
   * @param {Object} [filters]
   * @param {string} [filters.type] - Filter by account type
   * @returns {Promise<Array>}
   */
  async getLedgerAccounts(tenantId, filters = {}) {
    if (!tenantId) throw new Error('Tenant ID is required');
    const accounts = await GeneralLedgerRepository.getLedgerAccounts(tenantId, filters);
    return this._toAccountList(accounts);
  }

  /**
   * Get a single account with its full child hierarchy (flat list).
   *
   * @param {string} accountId
   * @param {string} tenantId
   * @returns {Promise<Object>}
   */
  async getAccountWithHierarchy(accountId, tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required');
    if (!accountId) throw new Error('Account ID is required');

    const account = await GeneralLedgerRepository.getAccountById(accountId, tenantId);
    if (!account) throw new Error('Account not found');

    const childIds = await GeneralLedgerRepository.getAccountHierarchy(accountId, tenantId);
    const children = await GeneralLedgerRepository.getLedgerAccounts(tenantId, {
      parentAccountId: accountId,
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        parentAccountId: account.parentAccountId,
      },
      childAccountIds: childIds.filter((id) => id !== accountId),
      childAccounts: this._toAccountList(children),
    };
  }

  /**
   * Transform raw account records into the dropdown-friendly format
   * with hierarchy levels for indentation.
   */
  _toAccountList(accounts) {
    if (!accounts || accounts.length === 0) return [];

    // Build a map of parentId -> children for hierarchy calculation
    const accountMap = new Map();
    accounts.forEach((a) => {
      const plain = a.toJSON ? a.toJSON() : a;
      accountMap.set(plain.id, plain);
    });

    // Compute hierarchy level for each account
    function getHierarchyLevel(acct, depth = 0) {
      if (!acct || !acct.parentAccountId) return depth;
      const parent = accountMap.get(acct.parentAccountId);
      if (!parent || depth > 10) return depth;
      return getHierarchyLevel(parent, depth + 1);
    }

    return accounts.map((a) => {
      const plain = a.toJSON ? a.toJSON() : a;
      const hierarchyLevel = getHierarchyLevel(plain);
      const isParent = accounts.some(
        (child) => {
          const c = child.toJSON ? child.toJSON() : child;
          return c.parentAccountId === plain.id;
        }
      );

      return {
        id: plain.id,
        code: plain.code,
        name: plain.name,
        type: plain.type,
        parentAccountId: plain.parentAccountId || null,
        hierarchyLevel,
        isParent,
      };
    });
  }
}

module.exports = new GeneralLedgerService();
