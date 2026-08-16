const assetAuditRepository = require('../repositories/AssetAuditRepository');
const { Asset } = require('../models');
const { ConflictError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class AssetAuditService {
  async getAudits(tenantId, query = {}) {
    const { page = 1, limit = 20, isVerified, isMissing, assetId, search } = query;
    const filters = {};
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true' || isVerified === true;
    if (isMissing !== undefined) filters.isMissing = isMissing === 'true' || isMissing === true;
    if (assetId) filters.assetId = assetId;
    return await assetAuditRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
    });
  }

  async getAuditById(id, tenantId) {
    const audit = await assetAuditRepository.findById(id, tenantId);
    if (!audit) throw new NotFoundError('Asset audit not found');
    return audit;
  }

  async getNextNumber(tenantId) {
    return await assetAuditRepository.getNextAuditNumber(tenantId);
  }

  async createAudit(data, tenantId, userId) {
    if (!data.auditNumber) {
      data.auditNumber = await assetAuditRepository.getNextAuditNumber(tenantId);
    } else {
      const existing = await assetAuditRepository.findByNumber(data.auditNumber, tenantId);
      if (existing) {
        throw new ConflictError(`Audit number "${data.auditNumber}" already exists`);
      }
    }

    const asset = await Asset.findOne({ where: { id: data.assetId, tenantId } });
    if (!asset) throw new NotFoundError('Asset not found');

    const audit = await assetAuditRepository.create(data, tenantId, userId);
    logger.info(`Asset audit created: ${audit.auditNumber} for asset ${asset.assetCode} in tenant ${tenantId}`);
    return await assetAuditRepository.findById(audit.id, tenantId);
  }

  async deleteAudit(id, tenantId) {
    const audit = await assetAuditRepository.findById(id, tenantId);
    if (!audit) throw new NotFoundError('Asset audit not found');
    await assetAuditRepository.delete(id, tenantId);
    logger.info(`Asset audit deleted: ${audit.auditNumber} in tenant ${tenantId}`);
  }
}

module.exports = new AssetAuditService();
