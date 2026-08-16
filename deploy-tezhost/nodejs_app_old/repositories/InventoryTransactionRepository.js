const BaseRepository = require('./BaseRepository');
const { InventoryTransaction, Warehouse, Item } = require('../models');
const { Op } = require('sequelize');

class InventoryTransactionRepository extends BaseRepository {
  constructor() {
    super(InventoryTransaction);
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['transactionDate', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };

    const offset = (page - 1) * limit;

    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
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

  async findByItem(itemId, tenantId, options = {}) {
    return await this.model.findAll({
      where: { itemId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['transactionDate', 'DESC']],
      ...options,
    });
  }

  async findByWarehouse(warehouseId, tenantId, options = {}) {
    return await this.model.findAll({
      where: { warehouseId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['transactionDate', 'DESC']],
      ...options,
    });
  }

  async findByReference(referenceType, referenceId, tenantId) {
    return await this.model.findAll({
      where: { referenceType, referenceId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['transactionDate', 'ASC']],
    });
  }

  async findByTransactionType(transactionType, tenantId, options = {}) {
    return await this.model.findAll({
      where: { transactionType, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['transactionDate', 'DESC']],
      ...options,
    });
  }

  async getCurrentBalance(itemId, warehouseId, tenantId) {
    const result = await this.model.findOne({
      where: { itemId, warehouseId, tenantId },
      order: [['transactionDate', 'DESC']],
      attributes: ['runningBalance'],
    });
    return result ? parseFloat(result.runningBalance) : 0;
  }

  async bulkCreate(records, options = {}) {
    // Hard guard: ensure every record has a valid tenantId
    const allHaveTenant = records.length > 0 && records.every(r => r.tenantId);
    if (!allHaveTenant) {
      throw new Error(
        `InventoryTransactionRepository.bulkCreate: ${records.length} record(s) with missing tenantId`
      );
    }
    return await this.model.bulkCreate(records, options);
  }
}

module.exports = new InventoryTransactionRepository();