'use strict';
const BaseRepository = require('./BaseRepository');
const { PosSale } = require('../models');

class PosSaleRepository extends BaseRepository {
  constructor() {
    super(PosSale);
  }

  async findByInvoiceNumber(tenantId, invoiceNumber) {
    return PosSale.findOne({
      where: { tenantId, invoiceNumber },
      include: ['lines', 'payments', { association: 'customer', attributes: ['id', 'name', 'code'] }],
    });
  }

  async findSalesBySession(tenantId, sessionId) {
    return PosSale.findAll({
      where: { tenantId, sessionId },
      include: ['lines', 'payments'],
      order: [['createdAt', 'DESC']],
    });
  }

  async getDailySalesTotal(tenantId, date) {
    const result = await PosSale.findAll({
      where: {
        tenantId,
        invoiceDate: date,
        status: 'completed',
      },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('grand_total')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      raw: true,
    });
    return result[0] || { total: 0, count: 0 };
  }
}

module.exports = new PosSaleRepository();
