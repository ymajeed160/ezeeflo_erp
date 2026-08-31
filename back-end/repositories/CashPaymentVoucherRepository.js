'use strict';
const { Op } = require('sequelize');
const { CashPaymentVoucher, CashPaymentVoucherLine, Account, User } = require('../models');
const { sequelize } = require('../models');

class CashPaymentVoucherRepository {
  async generateVoucherNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `CPV-${year}-`;

    const last = await CashPaymentVoucher.findOne({
      where: {
        tenantId,
        voucherNumber: { [Op.like]: `${prefix}%` },
      },
      order: [['voucherNumber', 'DESC']],
      paranoid: false,
    });

    let seq = 1;
    if (last?.voucherNumber) {
      const parts = last.voucherNumber.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async findAll(tenantId, filters = {}) {
    const withDeleted = filters.includeDeleted === 'true' || filters.includeDeleted === true;
    const where = { tenantId, isDeleted: false };
    if (filters.status) where.status = filters.status;
    if (filters.startDate && filters.endDate) {
      where.voucherDate = { [Op.between]: [filters.startDate, filters.endDate] };
    } else if (filters.startDate) {
      where.voucherDate = { [Op.gte]: filters.startDate };
    } else if (filters.endDate) {
      where.voucherDate = { [Op.lte]: filters.endDate };
    }
    if (filters.cashAccountId) where.cashAccountId = filters.cashAccountId;
    if (filters.search) {
      where[Op.or] = [
        { voucherNumber: { [Op.like]: `%${filters.search}%` } },
        { payeeName: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;

    const { count, rows } = await CashPaymentVoucher.findAndCountAll({
      where,
      include: [
        { model: Account, as: 'cashAccount', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      paranoid: !withDeleted,
    });

    return { count, rows };
  }

  async findById(id, tenantId, transaction = null, includeDeleted = false) {
    return await CashPaymentVoucher.findOne({
      where: includeDeleted ? { id, tenantId } : { id, tenantId, isDeleted: false, deletedAt: null },
      paranoid: !includeDeleted,
      include: [
        { model: Account, as: 'cashAccount', attributes: ['id', 'code', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'poster', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: CashPaymentVoucherLine, as: 'lines', include: [
            { model: Account, as: 'account', attributes: ['id', 'code', 'name', 'type'] },
          ],
        },
      ],
      transaction,
    });
  }

  async create(data, lines, transaction) {
    const voucher = await CashPaymentVoucher.create(data, { transaction });
    if (lines && lines.length > 0) {
      const lineData = lines.map((l, i) => ({ ...l, voucherId: voucher.id, lineNumber: i + 1 }));
      await CashPaymentVoucherLine.bulkCreate(lineData, { transaction });
    }
    return this.findById(voucher.id, data.tenantId, transaction);
  }

  async update(id, tenantId, data, lines, transaction) {
    await CashPaymentVoucher.update(data, { where: { id, tenantId }, transaction });
    if (lines) {
      await CashPaymentVoucherLine.destroy({ where: { voucherId: id }, transaction });
      const lineData = lines.map((l, i) => ({ ...l, voucherId: id, lineNumber: i + 1 }));
      await CashPaymentVoucherLine.bulkCreate(lineData, { transaction });
    }
    return this.findById(id, tenantId, transaction);
  }

  async softDelete(id, tenantId) {
    return await CashPaymentVoucher.update({ isDeleted: true }, { where: { id, tenantId } });
  }

  async destroy(id, tenantId, transaction = null) {
    return await CashPaymentVoucher.destroy({ where: { id, tenantId }, transaction });
  }

  async restore(id, tenantId, transaction = null) {
    return await CashPaymentVoucher.update(
      { deletedAt: null, deletedBy: null, deleteReason: null, isDeleted: false },
      { where: { id, tenantId }, paranoid: false, transaction }
    );
  }
}

module.exports = new CashPaymentVoucherRepository();
