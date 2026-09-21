const { LoyaltyAccount, PointTransaction, Customer, MembershipTier, GiftCard, Coupon, CouponUsage, RewardRedemption, Reward } = require('../models');
const { Op } = require('sequelize');

/**
 * Customer Digital Wallet Service
 * Aggregates all customer value instruments into a unified wallet view.
 */
class WalletService {
  /**
   * Get full wallet for a customer
   */
  async getWallet(customerId, companyId) {
    const [loyalty, giftCards, coupons, cashback, membership] = await Promise.all([
      this._getLoyaltyBalance(customerId, companyId),
      this._getGiftCards(customerId, companyId),
      this._getActiveCoupons(customerId, companyId),
      this._getCashback(customerId, companyId),
      this._getMembershipInfo(customerId, companyId),
    ]);

    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'code', 'firstName', 'lastName', 'email', 'phone', 'lifetimeValue', 'totalVisits', 'lastVisitDate'],
    });

    return {
      customer: customer ? {
        id: customer.id, code: customer.code, name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
        email: customer.email, phone: customer.phone,
      } : null,
      loyalty,
      giftCards,
      coupons,
      cashback,
      membership,
      summary: {
        totalPointsAvailable: loyalty.availablePoints,
        totalPendingPoints: loyalty.pendingPoints,
        totalGiftCardBalance: giftCards.reduce((s, g) => s + parseFloat(g.currentBalance || 0), 0),
        totalCashback: cashback.total,
        activeCoupons: coupons.length,
        totalValue: loyalty.availablePoints + giftCards.reduce((s, g) => s + parseFloat(g.currentBalance || 0), 0) + cashback.total,
      },
    };
  }

  async _getLoyaltyBalance(customerId, companyId) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: MembershipTier, as: 'membership', attributes: ['id', 'name', 'code', 'color', 'icon', 'pointMultiplier'] }],
    });

    if (!account) return { availablePoints: 0, pendingPoints: 0, expiredPoints: 0, redeemedPoints: 0, lifetimeEarned: 0, lifetimeRedeemed: 0, currentTierPoints: 0 };

    // Calculate expiring points (next 30 days)
    const expiringPoints = await PointTransaction.sum('points', {
      where: {
        loyaltyAccountId: account.id,
        transactionType: { [Op.in]: ['earn', 'bonus', 'welcome', 'referral'] },
        expiresAt: { [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), [Op.gt]: new Date() },
      },
    });

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      availablePoints: account.availablePoints,
      pendingPoints: account.pendingPoints,
      expiredPoints: account.expiredPoints,
      redeemedPoints: account.redeemedPoints,
      lifetimeEarned: account.lifetimeEarned,
      lifetimeRedeemed: account.lifetimeRedeemed,
      currentTierPoints: account.currentTierPoints,
      expiringPoints: Math.abs(expiringPoints || 0),
      enrolledDate: account.enrolledDate,
      lastActivityDate: account.lastActivityDate,
    };
  }

  async _getGiftCards(customerId, companyId) {
    return await GiftCard.findAll({
      where: {
        companyId,
        status: 'active',
        [Op.or]: [{ purchaserCustomerId: customerId }, { recipientCustomerId: customerId }],
      },
      attributes: ['id', 'cardNumber', 'pin', 'currentBalance', 'initialBalance', 'currency', 'expiryDate', 'status'],
    });
  }

  async _getActiveCoupons(customerId, companyId) {
    const usages = await CouponUsage.findAll({
      where: { customerId },
      include: [{
        model: Coupon,
        as: 'coupon',
        where: { companyId, isActive: true, endDate: { [Op.gte]: new Date() } },
        required: true,
      }],
    });

    return usages.map(u => ({
      id: u.coupon?.id,
      code: u.coupon?.code,
      couponType: u.coupon?.couponType,
      discountType: u.coupon?.discountType,
      discountValue: u.coupon?.discountValue,
      minPurchase: u.coupon?.minPurchase,
      maxDiscount: u.coupon?.maxDiscount,
      endDate: u.coupon?.endDate,
      usageCount: u.coupon?.usageCount,
      usageLimit: u.coupon?.usageLimit,
      perCustomerLimit: u.coupon?.perCustomerLimit,
      redeemedCount: u.usageCount,
    })).filter(c => c.id);
  }

  async _getCashback(customerId, companyId) {
    // Placeholder for store credit / cashback system
    return { total: 0, currency: 'AED', transactions: [] };
  }

  async _getMembershipInfo(customerId, companyId) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: MembershipTier, as: 'membership' }],
    });

    if (!account || !account.membership) return null;

    const nextTier = await MembershipTier.findOne({
      where: { companyId, minPoints: { [Op.gt]: account.currentTierPoints }, isActive: true },
      order: [['minPoints', 'ASC']],
    });

    return {
      currentTier: {
        id: account.membership.id, name: account.membership.name, code: account.membership.code,
        color: account.membership.color, icon: account.membership.icon,
        pointMultiplier: parseFloat(account.membership.pointMultiplier),
      },
      nextTier: nextTier ? {
        id: nextTier.id, name: nextTier.name, code: nextTier.code,
        pointsNeeded: nextTier.minPoints - account.currentTierPoints,
      } : null,
    };
  }

  /**
   * Get wallet summary list (for admin dashboard)
   */
  async getWalletsSummary(companyId, { page = 1, limit = 20 } = {}) {
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await LoyaltyAccount.findAndCountAll({
      where: { companyId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName', 'email', 'phone'] },
        { model: MembershipTier, as: 'membership', attributes: ['id', 'name', 'code', 'color'] },
      ],
      limit: parseInt(limit) || 20, offset,
      order: [['availablePoints', 'DESC']],
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)) } };
  }
}

module.exports = new WalletService();
