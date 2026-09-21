const { PointTransaction, LoyaltyAccount, Customer, MembershipTier, User } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class TransactionService {
  /**
   * Get all transactions with filters
   */
  async getAll(companyId, { page = 1, limit = 20, customerId, transactionType, startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'DESC' } = {}) {
    const where = { companyId };

    if (customerId) where.customerId = customerId;
    if (transactionType) where.transactionType = transactionType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z');
    }
    if (search) {
      where[Op.or] = [
        { source: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
        { posTransactionId: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await PointTransaction.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName', 'phone'], required: false },
        { model: LoyaltyAccount, as: 'loyaltyAccount', attributes: ['id', 'accountNumber'], required: false, include: [{ model: MembershipTier, as: 'membership', attributes: ['id', 'name', 'color'], required: false }] },
        { model: User, as: 'creator', attributes: ['id', 'username'], required: false },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    return {
      rows, count,
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  /**
   * Get a single transaction by ID
   */
  async getById(id, companyId) {
    const txn = await PointTransaction.findOne({
      where: { id, companyId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName', 'phone'] },
        { model: LoyaltyAccount, as: 'loyaltyAccount', attributes: ['id', 'accountNumber'], include: [{ model: MembershipTier, as: 'membership', attributes: ['id', 'name'] }] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
      ],
    });
    if (!txn) throw new NotFoundError('Transaction not found');
    return txn;
  }

  /**
   * Get transaction summary / statistics
   */
  async getSummary(companyId, { startDate, endDate, customerId } = {}) {
    const where = { companyId };
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z');
    }

    const earnTypes = ['earn', 'bonus', 'welcome', 'referral', 'transfer_in'];
    const redeemTypes = ['redeem', 'transfer_out'];

    const [earned, redeemed, expired, adjusted, totalCount] = await Promise.all([
      PointTransaction.sum('points', { where: { ...where, transactionType: { [Op.in]: earnTypes } } }),
      PointTransaction.sum('points', { where: { ...where, transactionType: { [Op.in]: redeemTypes } } }),
      PointTransaction.sum('points', { where: { ...where, transactionType: 'expire' } }),
      PointTransaction.sum('points', { where: { ...where, transactionType: 'adjust' } }),
      PointTransaction.count({ where }),
    ]);

    return {
      totalEarned: Math.abs(earned || 0),
      totalRedeemed: Math.abs(redeemed || 0),
      totalExpired: Math.abs(expired || 0),
      totalAdjusted: adjusted || 0,
      totalTransactions: totalCount,
      netPoints: (Math.abs(earned || 0)) - (Math.abs(redeemed || 0)) - (Math.abs(expired || 0)),
    };
  }

  /**
   * Get transactions for a specific customer
   */
  async getCustomerTransactions(customerId, companyId, { page = 1, limit = 20, transactionType } = {}) {
    return await this.getAll(companyId, { customerId, transactionType, page, limit });
  }
}

module.exports = new TransactionService();
