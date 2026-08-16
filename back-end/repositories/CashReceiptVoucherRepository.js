'use strict';
const { Op } = require('sequelize');
const { CashReceiptVoucher, CashReceiptVoucherLine, Account, User } = require('../models');

class CashReceiptVoucherRepository {
  async generateVoucherNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `CRV-${year}-`;

    const last = await CashReceiptVoucher.findOne({
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
        { payerName: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;

    const { count, rows } = await CashReceiptVoucher.findAndCountAll({
      where,
      include: [
        { model: Account, as: 'cashAccount', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { count, rows };
  }

  async findById(id, tenantId, transaction = null) {
    return await CashReceiptVoucher.findOne({
      where: { id, tenantId, isDeleted: false },
      include: [
        { model: Account, as: 'cashAccount', attributes: ['id', 'code', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'poster', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: CashReceiptVoucherLine, as: 'lines', include: [
            { model: Account, as: 'account', attributes: ['id', 'code', 'name', 'type'] },
          ],
        },
      ],
      transaction,
    });
  }

  async create(data, lines, transaction) {
    const voucher = await CashReceiptVoucher.create(data, { transaction });
    if (lines && lines.length > 0) {
      const lineData = lines.map((l, i) => ({ ...l, voucherId: voucher.id, lineNumber: i + 1 }));
      await CashReceiptVoucherLine.bulkCreate(lineData, { transaction });
    }
    return this.findById(voucher.id, data.tenantId, transaction);
  }

  async update(id, tenantId, data, lines, transaction) {
    await CashReceiptVoucher.update(data, { where: { id, tenantId }, transaction });
    if (lines) {
      await CashReceiptVoucherLine.destroy({ where: { voucherId: id }, transaction });
      const lineData = lines.map((l, i) => ({ ...l, voucherId: id, lineNumber: i + 1 }));
      await CashReceiptVoucherLine.bulkCreate(lineData, { transaction });
    }
    return this.findById(id, tenantId, transaction);
  }

  async softDelete(id, tenantId) {
    return await CashReceiptVoucher.update({ isDeleted: true }, { where: { id, tenantId } });
  }
}

module.exports = new CashReceiptVoucherRepository();
