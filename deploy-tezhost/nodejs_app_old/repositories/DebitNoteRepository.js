const { DebitNote, Supplier, PurchaseReturn, JournalEntry, User } = require('../models');

class DebitNoteRepository {
  async findAll(tenantId, options = {}) {
    const { page = 1, limit = 10, search, status, supplierId, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const where = { tenant_id: tenantId };
    if (status) where.status = status;
    if (supplierId) where.supplier_id = supplierId;
    if (startDate && endDate) {
      where.debit_note_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.debit_note_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.debit_note_date = { [Op.lte]: endDate };
    }
    const { Op } = require('sequelize');
    if (search) {
      where[Op.or] = [
        { debit_note_number: { [Op.like]: `%${search}%` } },
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
      where: { id, tenant_id: tenantId },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'code', 'name', 'contactPerson', 'phone', 'email'] },
        { model: PurchaseReturn, as: 'purchaseReturn', attributes: ['id', 'return_number', 'return_date'] },
        { model: JournalEntry, as: 'journalEntry' },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'approver', attributes: ['id', 'username'] }
      ],
      paranoid: true
    });
  }

  async findByNumber(tenantId, number) {
    return DebitNote.findOne({
      where: { tenant_id: tenantId, debit_note_number: number },
      paranoid: true
    });
  }

  async findLastNumber(tenantId) {
    return DebitNote.findOne({
      where: { tenant_id: tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: true
    });
  }

  async create(data) {
    return DebitNote.create(data);
  }

  async update(tenantId, id, data, transaction = null) {
    const record = await DebitNote.findOne({ where: { id, tenant_id: tenantId }, transaction });
    if (!record) return null;
    return record.update(data, { transaction });
  }

  async delete(tenantId, id) {
    const record = await DebitNote.findOne({ where: { id, tenant_id: tenantId } });
    if (!record) return null;
    return record.destroy();
  }
}

module.exports = new DebitNoteRepository();