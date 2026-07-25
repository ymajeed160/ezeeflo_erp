'use strict';
const { GoodsReceipt, GoodsReceiptDetail, PurchaseOrder, PurchaseOrderDetail, Supplier, Warehouse, Item, Tenant, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class GoodsReceiptRepository {
  async findAll(tenantId, filters = {}) {
    const { search, status, supplierId, purchaseOrderId, warehouseId, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = filters;
    const offset = (page - 1) * limit;
    delete filters.search; delete filters.status; delete filters.supplierId; delete filters.purchaseOrderId;
    delete filters.warehouseId; delete filters.startDate; delete filters.endDate;
    delete filters.page; delete filters.limit; delete filters.sortBy; delete filters.sortOrder;

    const where = { tenantId, ...filters };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate[Op.gte] = startDate;
      if (endDate) where.receiptDate[Op.lte] = endDate;
    }
    if (search) {
      where[Op.or] = [
        { grnNumber: { [Op.iLike]: `%${search}%` } },
        { reference: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await GoodsReceipt.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'orderNumber'] },
        { model: GoodsReceiptDetail, as: 'details', attributes: ['id', 'receivedQuantity'] },
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit: parseInt(limit),
      distinct: true,
    });

    return { rows, count, page: parseInt(page), limit: parseInt(limit) };
  }

  async findById(tenantId, id) {
    return await GoodsReceipt.findOne({
      where: { tenantId, id },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
        { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'orderNumber'] },
        {
          model: GoodsReceiptDetail, as: 'details',
          include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType'] }],
        },
      ],
    });
  }

  async getMaxGRNNumber(tenantId) {
    const result = await GoodsReceipt.findOne({
      where: { tenantId },
      attributes: ['grnNumber'],
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });
    return result ? result.grnNumber : null;
  }

  async create(tenantId, data, t) {
    return await GoodsReceipt.create({ ...data, tenantId }, { transaction: t });
  }

  async createDetails(details, t) {
    return await GoodsReceiptDetail.bulkCreate(details, { transaction: t });
  }

  async update(tenantId, id, data, t) {
    const gr = await GoodsReceipt.findOne({ where: { tenantId, id }, transaction: t });
    if (!gr) throw new Error('Goods Receipt not found');
    await gr.update(data, { transaction: t });
    return gr;
  }

  async delete(tenantId, id, t) {
    const gr = await GoodsReceipt.findOne({ where: { tenantId, id }, transaction: t });
    if (!gr) throw new Error('Goods Receipt not found');
    await GoodsReceiptDetail.destroy({ where: { goodsReceiptId: id }, transaction: t });
    await gr.destroy({ transaction: t });
    return true;
  }

  async replaceDetails(goodsReceiptId, details, t) {
    await GoodsReceiptDetail.destroy({ where: { goodsReceiptId }, transaction: t });
    if (details.length > 0) {
      await GoodsReceiptDetail.bulkCreate(details, { transaction: t });
    }
    return true;
  }

  async getAlreadyReceivedQty(tenantId, purchaseOrderId, itemId, excludeGoodsReceiptId = null) {
    if (!purchaseOrderId) return 0;
    const whereClause = {
      goodsReceiptId: { [Op.in]: sequelize.literal(
        `(SELECT id FROM \`GoodsReceipts\` WHERE \`purchase_order_id\` = '${purchaseOrderId}' AND \`tenant_id\` = '${tenantId}' AND \`status\` = 'received' AND \`deleted_at\` IS NULL${excludeGoodsReceiptId ? ` AND \`id\` != '${excludeGoodsReceiptId}'` : ''})`
      ) },
      itemId,
    };
    const result = await GoodsReceiptDetail.sum('receivedQuantity', { where: whereClause });
    return parseFloat(result || 0);
  }
}

module.exports = new GoodsReceiptRepository();