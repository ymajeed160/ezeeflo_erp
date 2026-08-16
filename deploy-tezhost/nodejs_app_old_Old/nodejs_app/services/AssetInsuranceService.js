const repo = require('../repositories/AssetInsuranceRepository');
const { Asset } = require('../models');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetInsuranceService {
  async getAll(t, q) { const { page = 1, limit = 20, status, search } = q; const f = {}; if (status) f.status = status; return await repo.findAndCountAll(t, { page: parseInt(page), limit: parseInt(limit), filters: f, search }); }
  async getById(id, t) { const r = await repo.findById(id, t); if (!r) throw new NotFoundError('Insurance not found'); return r; }
  async getNextNumber(t) { return await repo.getNextInsuranceNumber(t); }
  async getExpiring(t, days = 30) { return await repo.findExpiring(t, days); }
  async create(d, t, u) {
    if (!d.insuranceNumber) d.insuranceNumber = await repo.getNextInsuranceNumber(t);
    else { const e = await repo.findByNumber(d.insuranceNumber, t); if (e) throw new ConflictError(`Insurance number "${d.insuranceNumber}" already exists`); }
    const asset = await Asset.findOne({ where: { id: d.assetId, tenantId: t } }); if (!asset) throw new NotFoundError('Asset not found');
    const r = await repo.create({ insuranceNumber: d.insuranceNumber, assetId: d.assetId, insuranceCompany: d.insuranceCompany, policyNumber: d.policyNumber, premium: parseFloat(d.premium || 0), coverageAmount: parseFloat(d.coverageAmount || 0), startDate: d.startDate || null, expiryDate: d.expiryDate || null, renewalReminderDays: d.renewalReminderDays || 30, notes: d.notes || null, status: d.status || 'active' }, t, u);
    logger.info(`Insurance ${r.insuranceNumber} created for asset ${asset.assetCode}`); return await repo.findById(r.id, t);
  }
  async update(id, d, t, u) { const r = await repo.findById(id, t); if (!r) throw new NotFoundError('Insurance not found'); const up = await repo.update(id, d, t, u); return await repo.findById(id, t); }
  async delete(id, t) { const r = await repo.findById(id, t); if (!r) throw new NotFoundError('Insurance not found'); await repo.delete(id, t); }
}
module.exports = new AssetInsuranceService();
