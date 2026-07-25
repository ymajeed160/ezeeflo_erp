const db = require('../models');

class SupplierPaymentRepository {
  async findAll(tenantId, options) {
    const { page = 1, limit = 10, search, status, supplierId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const where = { tenantId };

    if (search) {
      where[db.Sequelize.Op.or] = [
        { paymentNumber: { [db.Sequelize.Op.like]: `%${search}%` } },
        { referenceNumber: { [db.Sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate && endDate) {
      where.paymentDate = { [db.Sequelize.Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.paymentDate = { [db.Sequelize.Op.gte]: startDate };
    } else if (endDate) {
      where.paymentDate = { [db.Sequelize.Op.lte]: endDate };
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await db.SupplierPayment.findAndCountAll({
      where,
      include: [
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'code', 'name'] },
        { model: db.Account, as: 'bankAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: db.JournalEntry, as: 'journalEntry', attributes: ['id', 'entry_number'], required: false },
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
        { model: db.SupplierPaymentAllocation, as: 'allocations', include: [{ model: db.PurchaseInvoice, as: 'invoice', attributes: ['id', 'invoice_number'] }] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    return { rows, count, page: parseInt(page), limit: parseInt(limit) };
  }

  async findById(tenantId, id) {
    return await db.SupplierPayment.findOne({
      where: { id, tenantId },
      include: [
        { model: db.Supplier, as: 'supplier' },
        { model: db.Account, as: 'bankAccount', required: false },
        { model: db.JournalEntry, as: 'journalEntry', required: false },
        { model: db.User, as: 'creator', attributes: ['id', 'username'] },
        { model: db.User, as: 'approver', attributes: ['id', 'username'] },
        { model: db.SupplierPaymentAllocation, as: 'allocations', include: [{ model: db.PurchaseInvoice, as: 'invoice' }] }
      ]
    });
  }

  async findByNumber(tenantId, paymentNumber) {
    return await db.SupplierPayment.findOne({ where: { tenantId, paymentNumber } });
  }

  async create(tenantId, data, transaction = null) {
    const t = transaction || await db.sequelize.transaction();
    try {
      const record = await db.SupplierPayment.create({
        tenantId: tenantId,
        paymentNumber: data.paymentNumber,
        paymentDate: data.paymentDate,
        supplierId: data.supplierId,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        referenceNumber: data.referenceNumber,
        bankAccountId: data.bankAccountId || data.bankAccount,
        notes: data.notes,
        status: data.status || 'draft',
        journalEntryId: data.journalEntryId || null,
        createdBy: data.createdBy
      }, { transaction: t });

      if (data.allocations && data.allocations.length > 0) {
        const allocationRecords = data.allocations.map(a => ({
          tenantId: tenantId,
          supplierPaymentId: record.id,
          purchaseInvoiceId: a.purchaseInvoiceId,
          allocatedAmount: a.allocatedAmount
        }));
        await db.SupplierPaymentAllocation.bulkCreate(allocationRecords, { transaction: t });
      }

      if (!transaction) await t.commit();
      return record;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  async update(tenantId, id, data, transaction = null) {
    const t = transaction || await db.sequelize.transaction();
    try {
      const record = await db.SupplierPayment.findOne({ where: { id, tenantId }, transaction: t });
      if (!record) {
        if (!transaction) await t.rollback();
        return null;
      }

      const updateFields = {};
      if (data.paymentDate !== undefined) updateFields.paymentDate = data.paymentDate;
      if (data.paymentMethod !== undefined) updateFields.paymentMethod = data.paymentMethod;
      if (data.amount !== undefined) updateFields.amount = data.amount;
      if (data.referenceNumber !== undefined) updateFields.referenceNumber = data.referenceNumber;
      if (data.bankAccountId !== undefined) updateFields.bankAccountId = data.bankAccountId;
      if (data.bankAccount !== undefined) updateFields.bankAccountId = data.bankAccount;
      if (data.notes !== undefined) updateFields.notes = data.notes;
      if (data.status !== undefined) updateFields.status = data.status;
      if (data.journalEntryId !== undefined) updateFields.journalEntryId = data.journalEntryId;

      await record.update(updateFields, { transaction: t });

      if (data.allocations) {
        await db.SupplierPaymentAllocation.destroy({ where: { supplierPaymentId: id, tenantId }, transaction: t });
        if (data.allocations.length > 0) {
          const allocationRecords = data.allocations.map(a => ({
            tenantId,
            supplierPaymentId: id,
            purchaseInvoiceId: a.purchaseInvoiceId,
            allocatedAmount: a.allocatedAmount
          }));
          await db.SupplierPaymentAllocation.bulkCreate(allocationRecords, { transaction: t });
        }
      }

      if (!transaction) await t.commit();
      return record;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  async delete(tenantId, id) {
    const record = await db.SupplierPayment.findOne({ where: { id, tenantId } });
    if (record) {
      await db.SupplierPaymentAllocation.destroy({ where: { supplierPaymentId: id, tenantId } });
      await record.destroy();
      return true;
    }
    return false;
  }

  async getNextPaymentNumber(tenantId) {
    const year = new Date().getFullYear().toString();
    const count = await db.SupplierPayment.count({
      where: {
        tenantId,
        paymentNumber: { [db.Sequelize.Op.like]: `SPAY-${year}-%` }
      }
    });
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `SPAY-${year}-${nextNumber}`;
  }
}

module.exports = new SupplierPaymentRepository();