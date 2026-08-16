const BaseRepository = require('./BaseRepository');
const { InventoryBalance, Warehouse, Item } = require('../models');
const { Op } = require('sequelize');

class InventoryBalanceRepository extends BaseRepository {
  constructor() {
    super(InventoryBalance);
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

  async findByWarehouseAndItem(warehouseId, itemId, tenantId) {
    return await this.model.findOne({
      where: { warehouseId, itemId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['id', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };

    if (search) {
      where[Op.or] = [];
    }

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

  async findByWarehouse(warehouseId, tenantId) {
    return await this.model.findAll({
      where: { warehouseId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['id', 'ASC']],
    });
  }

  async findByItem(itemId, tenantId) {
    return await this.model.findAll({
      where: { itemId, tenantId },
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'itemType', 'unitOfMeasure'] },
      ],
      order: [['id', 'ASC']],
    });
  }

  async upsertBalance(data, transaction = null) {
    const where = {
      tenantId: data.tenantId,
      warehouseId: data.warehouseId,
      itemId: data.itemId,
    };

    const [record, created] = await this.model.findOrCreate({
      where,
      defaults: {
        tenantId: data.tenantId,
        warehouseId: data.warehouseId,
        itemId: data.itemId,
        quantityOnHand: data.quantityOnHand,
        averageCost: data.averageCost,
      },
      transaction,
    });

    if (!created) {
      await record.update({
        quantityOnHand: data.quantityOnHand,
        averageCost: data.averageCost,
      }, { transaction });
    }

    return record;
  }
}

module.exports = new InventoryBalanceRepository();