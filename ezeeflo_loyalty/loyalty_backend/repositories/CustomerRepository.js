const { Customer, LoyaltyAccount, MembershipTier, CustomerMembership, PointTransaction, User, Company } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const logger = require('../utils/logger');

class CustomerRepository {
  async findAll(companyId, { page = 1, limit = 20, search, isActive, segment, source, tags, sortBy = 'createdAt', sortOrder = 'DESC' } = {}) {
    const where = { companyId };

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { nationalId: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (segment) where.segment = segment;
    if (source) where.source = source;
    if (tags && tags.length > 0) {
      where[Op.and] = tags.split(',').map(tag => 
        Sequelize.literal(`JSON_CONTAINS(tags, '"${tag.trim()}"')`)
      );
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        { model: LoyaltyAccount, as: 'loyaltyAccount', required: false, include: [{ model: MembershipTier, as: 'membership', required: false }] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
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

  async findById(id, companyId) {
    const customer = await Customer.findOne({
      where: { id, companyId },
      include: [
        { model: LoyaltyAccount, as: 'loyaltyAccount', required: false, include: [{ model: MembershipTier, as: 'membership', required: false }] },
        { model: CustomerMembership, as: 'customerMemberships', required: false, include: [{ model: MembershipTier, as: 'tier', required: false }, { model: MembershipTier, as: 'previousTier', required: false }], separate: true, order: [['createdAt', 'DESC']], limit: 5 },
        { model: PointTransaction, as: 'pointTransactions', required: false, separate: true, order: [['createdAt', 'DESC']], limit: 20 },
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'], required: false },
      ],
    });
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  async findLastCode(companyId) {
    const last = await Customer.findOne({
      where: { companyId },
      order: [['createdAt', 'DESC'], ['code', 'DESC']],
      paranoid: false,
      attributes: ['code'],
    });
    return last?.code || null;
  }

  async getSegments(companyId) {
    const segments = await Customer.findAll({
      where: { companyId, segment: { [Op.ne]: null } },
      attributes: ['segment', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['segment'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
    });
    return segments.map(s => ({ name: s.segment, count: s.get('count') }));
  }

  async getAllTags(companyId) {
    const customers = await Customer.findAll({
      where: { companyId, tags: { [Op.ne]: null } },
      attributes: ['tags'],
    });
    const tagSet = new Set();
    customers.forEach(c => {
      const tags = typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags;
      if (Array.isArray(tags)) tags.forEach(t => tagSet.add(t));
    });
    return [...tagSet].sort();
  }

  async mergeCustomers(primaryId, secondaryId, companyId) {
    const [primary, secondary] = await Promise.all([
      Customer.findByPk(primaryId, { where: { companyId } }),
      Customer.findByPk(secondaryId, { where: { companyId } }),
    ]);
    if (!primary || !secondary) throw new NotFoundError('One or both customers not found');
    if (primaryId === secondaryId) throw new ValidationError('Cannot merge a customer with itself');

    // Merge: update secondary's mergedIntoId, deactivate, move loyalty
    const primaryAccount = await LoyaltyAccount.findOne({ where: { customerId: primaryId } });
    const secondaryAccount = await LoyaltyAccount.findOne({ where: { customerId: secondaryId } });

    if (secondaryAccount && primaryAccount) {
      // Transfer points
      primaryAccount.availablePoints += secondaryAccount.availablePoints;
      primaryAccount.pendingPoints += secondaryAccount.pendingPoints;
      primaryAccount.lifetimeEarned += secondaryAccount.lifetimeEarned;
      primaryAccount.lifetimeRedeemed += secondaryAccount.lifetimeRedeemed;
      primaryAccount.currentTierPoints += secondaryAccount.currentTierPoints;

      // Update membership if secondary has higher tier
      if (secondaryAccount.membershipId) {
        primaryAccount.membershipId = secondaryAccount.membershipId;
      }
      await primaryAccount.save();
      // Create transfer transaction record
      await PointTransaction.create({
        companyId, loyaltyAccountId: primaryAccount.id, customerId: primaryId,
        transactionType: 'transfer_in', points: secondaryAccount.availablePoints,
        balanceBefore: primaryAccount.availablePoints - secondaryAccount.availablePoints,
        balanceAfter: primaryAccount.availablePoints,
        referenceType: 'merge', referenceId: secondaryId, source: 'Customer Merge',
        notes: `Merged from customer ${secondary.code}`,
      });
      // Deactivate secondary account
      secondaryAccount.isActive = false;
      await secondaryAccount.save();
    }

    // Update transactions reference
    await PointTransaction.update(
      { customerId: primaryId, loyaltyAccountId: primaryAccount?.id },
      { where: { customerId: secondaryId, companyId } }
    );

    // Update referrals
    const { Referral } = require('../models');
    await Referral.update({ referredCustomerId: primaryId }, { where: { referredCustomerId: secondaryId } });

    // Soft-delete secondary
    secondary.mergedIntoId = primaryId;
    secondary.isActive = false;
    await secondary.save();
    await secondary.destroy();

    // Increment lifetime value
    primary.lifetimeValue = parseFloat(primary.lifetimeValue || 0) + parseFloat(secondary.lifetimeValue || 0);
    primary.totalVisits += secondary.totalVisits || 0;
    await primary.save();

    return await this.findById(primaryId, companyId);
  }
}

module.exports = new CustomerRepository();
