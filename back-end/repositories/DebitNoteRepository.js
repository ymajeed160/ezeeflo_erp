const { DebitNote, Supplier, PurchaseReturn, JournalEntry, User } = require('../models');

class DebitNoteRepository {
  async findAll(tenantId, options = {}) {
    const { page = 1, limit = 10, search, status, supplierId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const where = { tenantId };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate && endDate) {
      where.debitNoteDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.debitNoteDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.debitNoteDate = { [Op.lte]: endDate };
    }
    const { Op } = require('sequelize');
    if (search) {
      where[Op.or] = [
        { debitNoteNumber: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
        { '$supplier.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await DebitNote.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: PurchaseReturn, as: 'purchaseReturn', attributes: ['id', 'return_number', 'return_date'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'approver', attributes: ['id', 'username'] }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit,
      paranoid: true
    });
    return { rows, count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findById(tenantId, id) {
    return DebitNote.findOne({
      where: { id, tenantId },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name', 'contactPerson', 'phone', 'email'] },
        { model: PurchaseReturn, as: 'purchaseReturn', attributes: ['id', 'return_number', 'return_date'] },
        { model: JournalEntry, as: 'journalEntry', required: false },
        { model: User, as: 'creator', attributes: ['id', 'username'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'username'], required: false }
      ],
      paranoid: true
    });
  }

  async findByNumber(tenantId, number) {
    return DebitNote.findOne({
      where: { tenantId, debitNoteNumber: number },
      paranoid: true
    });
  }

  async findLastNumber(tenantId) {
    return DebitNote.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: true
    });
  }

  async create(data) {
    return DebitNote.create(data);
  }

  async update(tenantId, id, data, transaction = null) {
    const record = await DebitNote.findOne({ where: { id, tenantId }, transaction });
    if (!record) return null;
    return record.update(data, { transaction });
  }

  async delete(tenantId, id) {
    const record = await DebitNote.findOne({ where: { id, tenantId } });
    if (!record) return null;
    return record.destroy();
  }
}

module.exports = new DebitNoteRepository();