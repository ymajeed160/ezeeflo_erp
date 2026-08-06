const { MembershipTier, CustomerMembership, LoyaltyAccount, Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const { Op } = require('sequelize');

class MembershipService {
  async getAllTiers(companyId, { page, limit, isActive }) {
    const where = { companyId };
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 100);

    const { count, rows } = await MembershipTier.findAndCountAll({
      where,
      order: [['sortOrder', 'ASC']],
      limit: parseInt(limit) || 100,
      offset,
    });

    return {
      rows, count,
      pagination: {
        page: parseInt(page) || 1, limit: parseInt(limit) || 100, total: count,
        totalPages: Math.ceil(count / (parseInt(limit) || 100)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: (parseInt(page) || 1) > 1,
      },
    };
  }

  async getTierById(id, companyId) {
    const tier = await MembershipTier.findOne({
      where: { id, companyId },
      include: [
        { model: LoyaltyAccount, as: 'accounts', required: false, attributes: ['id', 'accountNumber'], include: [{ model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName'], required: false }] },
      ],
    });
    if (!tier) throw new NotFoundError('Membership tier not found');
    return tier;
  }

  async createTier(data, companyId) {
    const existing = await MembershipTier.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Tier code already exists');

    // Normalize benefits
    if (data.benefits && typeof data.benefits === 'string') {
      try { data.benefits = JSON.parse(data.benefits); } catch { data.benefits = {}; }
    }

    return await MembershipTier.create({ id: uuidv4(), ...data, companyId });
  }

  async updateTier(id, data, companyId) {
    const tier = await MembershipTier.findOne({ where: { id, companyId } });
    if (!tier) throw new NotFoundError('Membership tier not found');

    if (data.benefits && typeof data.benefits === 'string') {
      try { data.benefits = JSON.parse(data.benefits); } catch { }
    }

    await tier.update(data);
    return tier;
  }

  async deleteTier(id, companyId) {
    const tier = await MembershipTier.findOne({ where: { id, companyId } });
    if (!tier) throw new NotFoundError('Membership tier not found');

    // Check if tier is in use
    const usageCount = await LoyaltyAccount.count({ where: { membershipId: id } });
    if (usageCount > 0) throw new ValidationError(`Cannot delete: ${usageCount} customers are assigned to this tier`);

    await tier.destroy();
  }

  async toggleTierStatus(id, companyId) {
    const tier = await MembershipTier.findOne({ where: { id, companyId } });
    if (!tier) throw new NotFoundError('Membership tier not found');
    tier.isActive = !tier.isActive;
    await tier.save();
    return tier;
  }

  /**
   * Evaluate and update a customer's membership tier based on their loyalty points
   */
  async evaluateCustomerTier(customerId, companyId) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: MembershipTier, as: 'membership' }],
    });
    if (!account) throw new NotFoundError('Loyalty account not found');

    // Find all active tiers ordered by minPoints
    const tiers = await MembershipTier.findAll({
      where: { companyId, isActive: true },
      order: [['minPoints', 'ASC']],
    });

    if (tiers.length === 0) return { changed: false, reason: 'No active tiers' };

    // Find the highest qualifying tier based on current tier points
    const currentPoints = account.currentTierPoints;
    let qualifyingTier = tiers[0]; // Default to lowest tier

    for (const tier of tiers) {
      if (currentPoints >= tier.minPoints && (!tier.maxPoints || currentPoints <= tier.maxPoints)) {
        qualifyingTier = tier;
      }
      if (!tier.maxPoints && currentPoints >= tier.minPoints) {
        qualifyingTier = tier;
      }
    }

    // No change
    if (account.membershipId === qualifyingTier.id) {
      return { changed: false, currentTier: account.membership?.name };
    }

    const previousTierId = account.membershipId;
    const isUpgrade = qualifyingTier.sortOrder > (account.membership?.sortOrder || 0);

    // Close current membership
    if (account.membershipId) {
      await CustomerMembership.update(
        { status: isUpgrade ? 'upgraded' : 'downgraded', endDate: new Date() },
        { where: { customerId, tierId: account.membershipId, status: 'active' } }
      );
    }

    // Create new membership
    await CustomerMembership.create({
      id: uuidv4(),
      companyId,
      customerId,
      tierId: qualifyingTier.id,
      startDate: new Date(),
      status: 'active',
      previousTierId,
      notes: isUpgrade ? 'Auto-upgraded based on points' : 'Auto-downgraded based on points',
    });

    // Update loyalty account
    account.membershipId = qualifyingTier.id;
    await account.save();

    return {
      changed: true,
      action: isUpgrade ? 'upgraded' : 'downgraded',
      from: account.membership?.name || 'None',
      to: qualifyingTier.name,
    };
  }

  /**
   * Manually assign a customer to a specific tier
   */
  async assignCustomerTier(customerId, tierId, companyId, notes) {
    const [account, tier] = await Promise.all([
      LoyaltyAccount.findOne({ where: { customerId, companyId } }),
      MembershipTier.findOne({ where: { id: tierId, companyId } }),
    ]);

    if (!account) throw new NotFoundError('Loyalty account not found');
    if (!tier) throw new NotFoundError('Membership tier not found');

    if (account.membershipId === tierId) {
      return { changed: false, message: 'Customer already in this tier' };
    }

    const previousTierId = account.membershipId;

    // Close existing active membership
    if (account.membershipId) {
      await CustomerMembership.update(
        { status: 'upgraded', endDate: new Date() },
        { where: { customerId, tierId: account.membershipId, status: 'active' } }
      );
    }

    // Create new membership
    await CustomerMembership.create({
      id: uuidv4(),
      companyId,
      customerId,
      tierId,
      startDate: new Date(),
      status: 'active',
      previousTierId,
      notes: notes || 'Manually assigned',
    });

    account.membershipId = tierId;
    await account.save();

    return await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: MembershipTier, as: 'membership' }],
    });
  }

  /**
   * Get membership history for a customer
   */
  async getCustomerMembershipHistory(customerId, companyId) {
    return await CustomerMembership.findAll({
      where: { customerId, companyId },
      include: [
        { model: MembershipTier, as: 'tier', attributes: ['id', 'name', 'code', 'color'] },
        { model: MembershipTier, as: 'previousTier', attributes: ['id', 'name', 'code', 'color'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get tier statistics
   */
  async getTierStats(companyId) {
    const tiers = await MembershipTier.findAll({
      where: { companyId },
      include: [{
        model: LoyaltyAccount, as: 'accounts',
        attributes: ['id'],
        where: { isActive: true },
        required: false,
      }],
      order: [['sortOrder', 'ASC']],
    });

    return tiers.map(t => ({
      id: t.id,
      name: t.name,
      code: t.code,
      color: t.color,
      sortOrder: t.sortOrder,
      customerCount: t.accounts?.length || 0,
      minPoints: t.minPoints,
      pointMultiplier: t.pointMultiplier,
    }));
  }

  /**
   * Batch evaluate all customers for tier changes
   */
  async batchEvaluateTiers(companyId) {
    const accounts = await LoyaltyAccount.findAll({
      where: { companyId, isActive: true },
      include: [{ model: MembershipTier, as: 'membership' }],
    });

    const tiers = await MembershipTier.findAll({
      where: { companyId, isActive: true },
      order: [['minPoints', 'ASC']],
    });

    if (tiers.length === 0) return { processed: 0, upgraded: 0, downgraded: 0, unchanged: totals.length };

    let upgraded = 0, downgraded = 0, unchanged = 0;

    for (const account of accounts) {
      const currentPoints = account.currentTierPoints;
      let qualifyingTier = tiers[0];
      for (const tier of tiers) {
        if (currentPoints >= tier.minPoints && (!tier.maxPoints || currentPoints <= tier.maxPoints)) {
          qualifyingTier = tier;
        }
        if (!tier.maxPoints && currentPoints >= tier.minPoints) {
          qualifyingTier = tier;
        }
      }

      if (account.membershipId === qualifyingTier.id) {
        unchanged++;
        continue;
      }

      const isUpgrade = qualifyingTier.sortOrder > (account.membership?.sortOrder || 0);

      if (account.membershipId) {
        await CustomerMembership.update(
          { status: isUpgrade ? 'upgraded' : 'downgraded', endDate: new Date() },
          { where: { customerId: account.customerId, tierId: account.membershipId, status: 'active' } }
        );
      }

      await CustomerMembership.create({
        id: uuidv4(), companyId, customerId: account.customerId,
        tierId: qualifyingTier.id, startDate: new Date(), status: 'active',
        previousTierId: account.membershipId,
        notes: isUpgrade ? 'Batch auto-upgraded' : 'Batch auto-downgraded',
      });

      account.membershipId = qualifyingTier.id;
      await account.save();

      if (isUpgrade) upgraded++; else downgraded++;
    }

    return { processed: accounts.length, upgraded, downgraded, unchanged };
  }

  /**
   * Get tier point multiplier for earning calculations
   */
  async getTierMultiplier(customerId, companyId) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId },
      include: [{ model: MembershipTier, as: 'membership' }],
    });
    if (!account || !account.membership) return 1.0;
    return parseFloat(account.membership.pointMultiplier || 1.0);
  }
}

module.exports = new MembershipService();
