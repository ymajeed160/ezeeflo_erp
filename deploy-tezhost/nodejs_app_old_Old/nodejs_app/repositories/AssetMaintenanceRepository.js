const BaseRepository = require('./BaseRepository');
const { AssetMaintenance, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetMaintenanceRepository extends BaseRepository {
  constructor() { super(AssetMaintenance); }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { maintenanceNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName', 'status'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) where[Op.or] = [{ maintenanceNumber: { [Op.like]: `%${search}%` } }, { title: { [Op.like]: `%${search}%` } }, { serviceProvider: { [Op.like]: `%${search}%` } }];
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }],
    });
    return { rows: result.rows, count: result.count, pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 } };
  }

  async findLastNumber(tenantId) {
    return await this.model.findOne({ where: { tenantId }, order: [['createdAt', 'DESC']], paranoid: false });
  }

  async getNextMaintenanceNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'AMN-000001';
    const num = parseInt(last.maintenanceNumber.replace('AMN-', ''), 10) + 1;
    return `AMN-${String(num).padStart(6, '0')}`;
  }

  async findDueReminders(tenantId, days = 30) {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return await this.model.findAll({
      where: { tenantId, status: ['scheduled', 'in_progress'], nextDueDate: { [Op.lte]: future.toISOString().split('T')[0] } },
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }],
      order: [['nextDueDate', 'ASC']],
    });
  }
}

module.exports = new AssetMaintenanceRepository();
