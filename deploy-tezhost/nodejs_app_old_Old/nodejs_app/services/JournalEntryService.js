const journalEntryRepository = require('../repositories/JournalEntryRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class JournalEntryService {
  /**
   * Validate that debits equal credits
   */
  _validateBalanced(lines) {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestError(
        `Journal entry is not balanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}`
      );
    }

    // Ensure at least one debit and one credit
    const hasDebit = lines.some(line => Number(line.debit || 0) > 0);
    const hasCredit = lines.some(line => Number(line.credit || 0) > 0);

    if (!hasDebit || !hasCredit) {
      throw new BadRequestError('Journal entry must have at least one debit and one credit line');
    }

    return { totalDebit, totalCredit };
  }

  /**
   * Validate that each line has either debit OR credit (not both, not neither)
   */
  _validateLines(lines) {
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      throw new BadRequestError('Journal entry must have at least 2 lines');
    }

    lines.forEach((line, index) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (debit > 0 && credit > 0) {
        throw new BadRequestError(
          `Line ${index + 1}: Cannot have both debit and credit amounts`
        );
      }

      if (debit === 0 && credit === 0) {
        throw new BadRequestError(
          `Line ${index + 1}: Must have either a debit or credit amount`
        );
      }

      if (!line.accountId) {
        throw new BadRequestError(`Line ${index + 1}: Account ID is required`);
      }

      if (debit < 0 || credit < 0) {
        throw new BadRequestError(`Line ${index + 1}: Amounts cannot be negative`);
      }
    });
  }

  async getAllEntries(tenantId, { page, limit, status, startDate, endDate } = {}) {
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (startDate || endDate) {
      filters.entryDate = {};
      if (startDate) filters.entryDate[require('sequelize').Op.gte] = startDate;
      if (endDate) filters.entryDate[require('sequelize').Op.lte] = endDate;
    }

    if (page && limit) {
      return await journalEntryRepository.findEntriesWithLines(tenantId, filters, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
    }

    // If no pagination, return all
    const result = await journalEntryRepository.findEntriesWithLines(tenantId, filters, {
      page: 1,
      limit: 1000,
    });
    return result.rows;
  }

  async getEntryById(id, tenantId) {
    const entry = await journalEntryRepository.findByIdWithLines(id, tenantId);
    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }
    return entry;
  }

  async getEntryByNumber(entryNumber, tenantId) {
    const entry = await journalEntryRepository.findByEntryNumber(entryNumber, tenantId, {
      include: [
        {
          model: require('../models').JournalEntryLine,
          as: 'lines',
          include: [
            {
              model: require('../models').Account,
              as: 'account',
              attributes: ['id', 'code', 'name', 'type'],
            },
          ],
        },
      ],
      order: [[{ model: require('../models').JournalEntryLine, as: 'lines' }, 'lineNumber', 'ASC']],
    });

    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }
    return entry;
  }

  async createEntry(data, tenantId, userId, transaction = null) {
    const { lines, entryDate, reference, description, fiscalPeriodId } = data;

    // Validate lines
    this._validateLines(lines);
    this._validateBalanced(lines);

    // Generate entry number
    const entryNumber = await journalEntryRepository.generateEntryNumber(tenantId);

    const entryData = {
      entryNumber,
      entryDate: entryDate || new Date().toISOString().split('T')[0],
      reference: reference || null,
      description: description || null,
      fiscalPeriodId: fiscalPeriodId || null,
      status: 'draft',
    };

    const entry = await journalEntryRepository.createEntryWithLines(
      entryData,
      lines,
      tenantId,
      userId,
      transaction
    );

    logger.info(`Journal entry ${entryNumber} created by user ${userId} in tenant ${tenantId}`);
    return entry;
  }

  async updateEntry(id, data, tenantId, userId) {
    const entry = await journalEntryRepository.findById(id, tenantId);
    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status === 'posted') {
      throw new BadRequestError('Cannot update a posted journal entry');
    }

    const { lines, entryDate, reference, description, fiscalPeriodId } = data;

    // If lines provided, validate them
    if (lines !== undefined) {
      this._validateLines(lines);
      this._validateBalanced(lines);
    }

    const updateData = {};
    if (entryDate !== undefined) updateData.entryDate = entryDate;
    if (reference !== undefined) updateData.reference = reference;
    if (description !== undefined) updateData.description = description;
    if (fiscalPeriodId !== undefined) updateData.fiscalPeriodId = fiscalPeriodId;

    const updated = await journalEntryRepository.updateEntryWithLines(
      id,
      updateData,
      lines,
      tenantId,
      userId
    );

    if (!updated) {
      throw new NotFoundError('Journal entry not found after update');
    }

    logger.info(`Journal entry ${id} updated by user ${userId}`);
    return updated;
  }

  async deleteEntry(id, tenantId) {
    const entry = await journalEntryRepository.findById(id, tenantId);
    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status === 'posted') {
      throw new BadRequestError('Cannot delete a posted journal entry');
    }

    const deleted = await journalEntryRepository.deleteEntry(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Journal entry not found');
    }

    logger.info(`Journal entry ${id} deleted from tenant ${tenantId}`);
    return true;
  }

  async postEntry(id, tenantId, userId) {
    const entry = await journalEntryRepository.findByIdWithLines(id, tenantId);
    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status === 'posted') {
      throw new BadRequestError('Journal entry is already posted');
    }

    // Validate balancing
    const lines = entry.lines || [];
    this._validateLines(lines.map(l => l.toJSON ? l.toJSON() : l));
    this._validateBalanced(lines.map(l => l.toJSON ? l.toJSON() : l));

    // Update status to posted
    const { JournalEntry } = require('../models');
    await JournalEntry.update(
      {
        status: 'posted',
        postedAt: new Date(),
        postedBy: userId,
        updatedBy: userId,
      },
      { where: { id, tenantId } }
    );

    const updated = await journalEntryRepository.findByIdWithLines(id, tenantId);
    logger.info(`Journal entry ${id} posted by user ${userId}`);
    return updated;
  }

  /**
   * Generate the next reference number for a new journal entry.
   * This is called when the "New Journal Entry" form loads to auto-populate
   * the Reference field with a sequential number like JE-000001.
   */
  async getNextReference(tenantId, sourceDoc = null) {
    // If generated from another transaction, use the source document number
    if (sourceDoc && sourceDoc.reference) {
      return sourceDoc.reference;
    }

    return await journalEntryRepository.generateReferenceNumber(tenantId);
  }

  async reverseEntry(id, tenantId, userId) {
    const entry = await journalEntryRepository.findByIdWithLines(id, tenantId);
    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status !== 'posted') {
      throw new BadRequestError('Only posted journal entries can be reversed');
    }

    // Generate reversal lines (swap debits and credits)
    const reversalLines = entry.lines.map(line => ({
      accountId: line.accountId,
      description: `Reversal of ${entry.entryNumber}: ${line.description || ''}`,
      debit: Number(line.credit || 0),
      credit: Number(line.debit || 0),
    }));

    const entryNumber = await journalEntryRepository.generateEntryNumber(tenantId);

    const reversal = await journalEntryRepository.createEntryWithLines(
      {
        entryNumber,
        entryDate: new Date().toISOString().split('T')[0],
        reference: entry.reference ? `REV-${entry.reference}` : `REV-${entry.entryNumber}`,
        description: `Reversal of journal entry ${entry.entryNumber}`,
        fiscalPeriodId: entry.fiscalPeriodId,
        status: 'draft',
        isAutoGenerated: true,
        source: 'reversal',
        sourceId: entry.id,
      },
      reversalLines,
      tenantId,
      userId
    );

    logger.info(`Journal entry ${entry.entryNumber} reversed by user ${userId}. New entry: ${reversal.entryNumber}`);
    return reversal;
  }
}

module.exports = new JournalEntryService();