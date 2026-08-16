const BaseRepository = require('./BaseRepository');
const { AssetInsurance, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetInsuranceRepository extends BaseRepository {
  constructor() { super(AssetInsurance); }
  async findByNumber(n, t) { return await this.model.findOne({ where: { insuranceNumber: n, tenantId: t } }); }
  async findById(id, t) { return await this.model.findOne({ where: { id, tenantId: t }, include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }, { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false }] }); }
  async findAndCountAll(t, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId: t, ...filters }; if (search) where[Op.or] = [{ insuranceNumber: { [Op.like]: `%${search}%` } }, { insuranceCompany: { [Op.like]: `%${search}%` } }, { policyNumber: { [Op.like]: `%${search}%` } }];
    const o = (page - 1) * limit; const r = await this.model.findAndCountAll({ where, limit, offset: o, order, distinct: true, include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }] });
    return { rows: r.rows, count: r.count, pagination: { page, limit, total: r.count, totalPages: Math.ceil(r.count / limit), hasNext: page * limit < r.count, hasPrev: page > 1 } };
  }
  async findLastNumber(t) { return await this.model.findOne({ where: { tenantId: t }, order: [['createdAt', 'DESC']], paranoid: false }); }
  async getNextInsuranceNumber(t) { const l = await this.findLastNumber(t); if (!l) return 'INS-000001'; const n = parseInt(l.insuranceNumber.replace('INS-', ''), 10) + 1; return `INS-${String(n).padStart(6, '0')}`; }
  async findExpiring(t, days = 30) { const d = new Date(); d.setDate(d.getDate() + days); return await this.model.findAll({ where: { tenantId: t, status: 'active', expiryDate: { [Op.lte]: d.toISOString().split('T')[0] } }, include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }], order: [['expiryDate', 'ASC']] }); }
}
module.exports = new AssetInsuranceRepository();
