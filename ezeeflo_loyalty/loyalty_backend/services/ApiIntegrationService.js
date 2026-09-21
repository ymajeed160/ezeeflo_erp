const { ApiKey, Company } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { NotFoundError, ValidationError } = require('../utils/appError');
const logger = require('../utils/logger');

class ApiIntegrationService {
  /**
   * Generate a new API key for a company
   */
  async createApiKey(data, companyId, userId) {
    const rawKey = `ezl_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = rawKey.substring(0, 10);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await ApiKey.create({
      id: uuidv4(), companyId,
      name: data.name,
      keyHash,
      prefix,
      permissions: data.permissions || ['read'],
      allowedIps: data.allowedIps || null,
      rateLimit: data.rateLimit || 1000,
      isActive: true,
      expiresAt: data.expiresAt || null,
      createdBy: userId,
    });

    // Return the raw key only once
    return { apiKey, rawKey };
  }

  /**
   * List all API keys for a company (never exposes raw key)
   */
  async listApiKeys(companyId) {
    return await ApiKey.findAll({
      where: { companyId },
      attributes: { exclude: ['keyHash'] },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Revoke/deactivate an API key
   */
  async revokeApiKey(id, companyId) {
    const key = await ApiKey.findOne({ where: { id, companyId } });
    if (!key) throw new NotFoundError('API key not found');
    key.isActive = false;
    await key.save();
    return key;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id, companyId) {
    const key = await ApiKey.findOne({ where: { id, companyId } });
    if (!key) throw new NotFoundError('API key not found');
    await key.destroy();
    return key;
  }

  /**
   * Validate an API key from request header
   */
  async validateApiKey(apiKeyHeader, companyId = null) {
    if (!apiKeyHeader) throw new ValidationError('API key required');

    const prefix = apiKeyHeader.substring(0, 10);
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    const where = { prefix, isActive: true };
    if (companyId) where.companyId = companyId;

    const key = await ApiKey.findOne({ where });
    if (!key) throw new ValidationError('Invalid API key');
    if (key.keyHash !== keyHash) throw new ValidationError('Invalid API key');
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) throw new ValidationError('API key expired');

    // Update last used
    key.lastUsedAt = new Date();
    await key.save();

    return key;
  }

  /**
   * POS Integration - earn points from external POS
   */
  async posEarnPoints(companyId, { customerId, purchaseAmount, storeId, branchId, posTransactionId }) {
    const pointsEngine = require('./PointsEngineService');
    const points = Math.round(parseFloat(purchaseAmount) || 0);

    const result = await pointsEngine.earnPoints({
      customerId, companyId, points,
      source: 'POS',
      referenceType: 'pos_transaction', referenceId: null,
      storeId, branchId, posTransactionId,
      notes: `POS purchase: AED ${purchaseAmount}`,
    });

    return {
      earned: result.transaction.points,
      balanceAfter: result.account.availablePoints,
      tier: result.account.membership?.name,
      posTransactionId,
    };
  }

  /**
   * POS Integration - get customer balance
   */
  async posGetCustomerBalance(companyId, customerId) {
    const { LoyaltyAccount, Customer, MembershipTier } = require('../models');
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: Customer, as: 'customer', attributes: ['id','code','firstName','lastName'] }, { model: MembershipTier, as: 'membership' }],
    });
    if (!account) throw new NotFoundError('Customer not found');

    return {
      customerId: account.customerId,
      customerName: `${account.customer?.firstName||''} ${account.customer?.lastName||''}`.trim(),
      customerCode: account.customer?.code,
      availablePoints: account.availablePoints,
      pendingPoints: account.pendingPoints,
      lifetimePoints: account.lifetimeEarned,
      membershipTier: account.membership?.name || 'Standard',
      tierMultiplier: parseFloat(account.membership?.pointMultiplier || 1),
    };
  }

  /**
   * POS Integration - redeem points
   */
  async posRedeemPoints(companyId, { customerId, points, posTransactionId }) {
    const pointsEngine = require('./PointsEngineService');
    const result = await pointsEngine.redeemPoints({
      customerId, companyId, points: parseInt(points),
      source: 'POS Redemption',
      referenceType: 'pos_redemption', posTransactionId,
      notes: `POS redemption: ${points} pts`,
    });

    return {
      redeemed: Math.abs(result.transaction.points),
      balanceAfter: result.account.availablePoints,
      posTransactionId,
    };
  }
}

module.exports = new ApiIntegrationService();
