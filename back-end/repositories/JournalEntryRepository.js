const BaseRepository = require('./BaseRepository');
const { JournalEntry, JournalEntryLine, Account } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

class JournalEntryRepository extends BaseRepository {
  constructor() {
    super(JournalEntry);
  }

  async findByEntryNumber(entryNumber, tenantId, options = {}) {
    return await this.model.findOne({
      where: { entryNumber, tenantId },
      ...options,
    });
  }

  async findByIdWithLines(id, tenantId, transaction = null) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name', 'type'],
            },
          ],
        },
      ],
      order: [[{ model: JournalEntryLine, as: 'lines' }, 'lineNumber', 'ASC']],
      transaction,
    });
  }

  async findEntriesWithLines(tenantId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const where = { tenantId, ...filters };
    const result = await this.model.findAndCountAll({
      where,
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [
            {
              model: Account,
              as: 'account',
              attributes: ['id', 'code', 'name', 'type'],
            },
          ],
        },
      ],
      order: [['entryDate', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
        hasNext: page * limit < result.count,
        hasPrev: page > 1,
      },
    };
  }

  async createEntryWithLines(entryData, linesData, tenantId, userId, externalTransaction = null) {
    const shouldUseOwnTx = !externalTransaction;
    const transaction = externalTransaction || await sequelize.transaction();
    try {
      const entry = await this.model.create(
        {
          ...entryData,
          tenantId,
          createdBy: userId,
          updatedBy: userId,
        },
        { transaction }
      );

      const lines = await JournalEntryLine.bulkCreate(
        linesData.map((line, index) => ({
          ...line,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          tenantId,
          journalEntryId: entry.id,
          lineNumber: index + 1,
        })),
        { transaction }
      );

      if (shouldUseOwnTx) {
        await transaction.commit();
        return this.findByIdWithLines(entry.id, tenantId);
      }
      return this.findByIdWithLines(entry.id, tenantId, transaction);
    } catch (error) {
      if (shouldUseOwnTx) await transaction.rollback();
      logger.error('JournalEntryRepository createEntryWithLines error:', { error: error.message, details: error.errors?.map(e => ({ field: e.path, value: e.value, message: e.message })) });
      throw error;
    }
  }

  async updateEntryWithLines(id, entryData, linesData, tenantId, userId) {
    const transaction = await sequelize.transaction();
    try {
      const entry = await this.model.findOne({
        where: { id, tenantId },
        transaction,
      });
      if (!entry) {
        await transaction.rollback();
        return null;
      }

      await entry.update(
        { ...entryData, updatedBy: userId },
        { transaction }
      );

      if (linesData !== undefined) {
        // Delete existing lines
        await JournalEntryLine.destroy({
          where: { journalEntryId: id, tenantId },
          transaction,
        });

        // Create new lines
        await JournalEntryLine.bulkCreate(
          linesData.map((line, index) => ({
            ...line,
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
            tenantId,
            journalEntryId: id,
            lineNumber: index + 1,
          })),
          { transaction }
        );
      }

      await transaction.commit();
      return this.findByIdWithLines(id, tenantId);
    } catch (error) {
      await transaction.rollback();
      logger.error('JournalEntryRepository updateEntryWithLines error:', { error: error.message });
      throw error;
    }
  }

  async deleteEntry(id, tenantId) {
    const transaction = await sequelize.transaction();
    try {
      // Delete lines first
      await JournalEntryLine.destroy({
        where: { journalEntryId: id, tenantId },
        transaction,
      });

      const deleted = await this.model.destroy({
        where: { id, tenantId },
        transaction,
      });

      await transaction.commit();
      return deleted > 0;
    } catch (error) {
      await transaction.rollback();
      logger.error('JournalEntryRepository deleteEntry error:', { error: error.message });
      throw error;
    }
  }

  async generateEntryNumber(tenantId) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `JE-${year}${month}-`;

    // Use raw query to find the max sequence number regardless of defaultScope ordering
    const [results] = await sequelize.query(
      `SELECT entry_number FROM journal_entries 
       WHERE tenant_id = ? AND entry_number LIKE ? 
       ORDER BY CAST(SUBSTRING(entry_number, 11) AS UNSIGNED) DESC LIMIT 1`,
      { replacements: [tenantId, `${prefix}%`] }
    );

    let sequence = 1;
    if (results && results.length > 0) {
      const parts = results[0].entry_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Generate the next sequential reference number (e.g. JE-000001, JE-000002).
   * Uses a row-level lock to prevent duplicate references during concurrent requests.
   * This is the auto-populated Reference field shown on the Create JE form.
   */
  async generateReferenceNumber(tenantId) {
    const transaction = await sequelize.transaction();
    try {
      // Lock all rows for this tenant to prevent concurrent reads
      const latest = await this.model.findOne({
        where: { tenantId },
        order: [['reference', 'DESC']],
        attributes: ['reference'],
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      let nextSequence = 1;
      if (latest && latest.reference) {
        // Extract numeric part from reference like JE-000123
        const match = latest.reference.match(/^JE-(\d+)$/);
        if (match) {
          nextSequence = parseInt(match[1], 10) + 1;
        }
      }

      await transaction.commit();
      return `JE-${String(nextSequence).padStart(6, '0')}`;
    } catch (error) {
      await transaction.rollback();
      logger.error('JournalEntryRepository generateReferenceNumber error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new JournalEntryRepository();
