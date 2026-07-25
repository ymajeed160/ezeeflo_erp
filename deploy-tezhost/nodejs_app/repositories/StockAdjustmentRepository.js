const BaseRepository = require('./BaseRepository');
const { StockAdjustment, StockAdjustmentDetail, Warehouse, User, Item } = require('../models');
const { Op, sequelize } = require('sequelize');

class StockAdjustmentRepository extends BaseRepository {
  constructor() {
    super(StockAdjustment);
  }

  async findById(id, tenantId, options = {}) {
    return await this.model.findOne({
      where: { id, tenantId },
      ...options,
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        {
          model: StockAdjustmentDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'unitOfMeasure', 'itemType'] },
          ],
        },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });
  }

  async findByAdjustmentNumber(adjustmentNumber, tenantId) {
    return await this.model.findOne({
      where: { adjustmentNumber, tenantId },
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };

    if (search) {
      where[Op.or] = [
        { adjustmentNumber: { [Op.like]: `%${search}%` } },
        { reason: { [Op.like]: `%${search}%` } },
      ];
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
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
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

  async createWithDetails(data, details, transaction, tenantId) {
    // Hard guard: tenantId must be defined, falling back to data.tenantId
    const effectiveTenantId = tenantId || data.tenantId;
    if (!effectiveTenantId) {
      throw new Error('StockAdjustmentRepository.createWithDetails: tenantId is missing (both param and data.tenantId are undefined/null)');
    }

    // Ensure the header record also has tenantId
    const headerData = { ...data, tenantId: effectiveTenantId };

    const adjustment = await this.model.create(headerData, { transaction });

    const detailRecords = details.map(detail => ({
      ...detail,
      stockAdjustmentId: adjustment.id,
      tenantId: effectiveTenantId,
    }));
    await StockAdjustmentDetail.bulkCreate(detailRecords, { transaction });

    // Return the created adjustment with full includes if possible, passing the
    // transaction so the read is consistent within the same transaction context.
    // Fallback to the raw adjustment if findById returns null (e.g., join issues
    // within the transaction). The service will call findById again after commit.
    const fullAdjustment = await this.findById(adjustment.id, effectiveTenantId, { transaction });
    return fullAdjustment || adjustment;
  }

  async updateStatus(id, status, updatedBy, tenantId, transaction = null) {
    const options = {
      where: { id, tenantId },
      transaction,
    };

    await this.model.update({ status, updatedBy }, options);
    return await this.findById(id, tenantId);
  }
}

module.exports = new StockAdjustmentRepository();