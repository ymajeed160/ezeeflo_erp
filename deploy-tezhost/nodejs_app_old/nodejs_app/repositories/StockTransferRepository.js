const BaseRepository = require('./BaseRepository');
const { StockTransfer, StockTransferDetail, Warehouse, User, Item } = require('../models');
const { Op } = require('sequelize');

class StockTransferRepository extends BaseRepository {
  constructor() {
    super(StockTransfer);
  }

  async findById(id, tenantId, transaction = null) {
    const options = {
      where: { id, tenantId },
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'code', 'name'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'code', 'name'] },
        {
          model: StockTransferDetail,
          as: 'details',
          include: [
            { model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'unitOfMeasure', 'itemType'] },
          ],
        },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    };
    if (transaction) {
      options.transaction = transaction;
    }
    return await this.model.findOne(options);
  }

  async findByTransferNumber(transferNumber, tenantId) {
    return await this.model.findOne({
      where: { transferNumber, tenantId },
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };

    if (search) {
      where[Op.or] = [
        { transferNumber: { [Op.like]: `%${search}%` } },
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
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'code', 'name'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'code', 'name'] },
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
      throw new Error('StockTransferRepository.createWithDetails: tenantId is missing (both param and data.tenantId are undefined/null)');
    }

    // Ensure the header record also has tenantId
    const headerData = { ...data, tenantId: effectiveTenantId };

    const transfer = await this.model.create(headerData, { transaction });

    const detailRecords = details.map(detail => ({
      ...detail,
      stockTransferId: transfer.id,
      tenantId: effectiveTenantId,
    }));
    await StockTransferDetail.bulkCreate(detailRecords, { transaction });

    // Return the created transfer with full includes if possible, passing the
    // transaction so the read is consistent within the same transaction context.
    // Fallback to the raw transfer if findById returns null (e.g., join issues
    // within the transaction). The service will call findById again after commit.
    const fullTransfer = await this.findById(transfer.id, effectiveTenantId, transaction);
    return fullTransfer || transfer;
  }

  async updateStatus(id, status, updatedBy, tenantId, transaction = null) {
    const options = {
      where: { id, tenantId },
      transaction,
    };

    await this.model.update({ status, updatedBy }, options);
    return await this.findById(id, tenantId, transaction);
  }
}

module.exports = new StockTransferRepository();