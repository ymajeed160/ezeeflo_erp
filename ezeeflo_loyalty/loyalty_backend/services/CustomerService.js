const customerRepository = require('../repositories/CustomerRepository');
const { Customer, LoyaltyAccount, MembershipTier, CustomerMembership } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class CustomerService {
  async getAll(companyId, query) {
    return await customerRepository.findAll(companyId, query);
  }

  async getById(id, companyId) {
    return await customerRepository.findById(id, companyId);
  }

  async getSegments(companyId) {
    return await customerRepository.getSegments(companyId);
  }

  async getAllTags(companyId) {
    return await customerRepository.getAllTags(companyId);
  }

  _generateCode(companyCode, lastCode) {
    const prefix = 'CUS';
    if (!lastCode) return `${prefix}-000001`;
    const match = lastCode.match(/(\d+)$/);
    if (!match) return `${prefix}-000001`;
    const next = parseInt(match[1]) + 1;
    return `${prefix}-${String(next).padStart(6, '0')}`;
  }

  async create(data, companyId, userId) {
    // Check for duplicate phone or email
    if (data.email) {
      const emailExists = await Customer.findOne({ where: { email: data.email, companyId } });
      if (emailExists) throw new ConflictError('A customer with this email already exists');
    }
    const phoneExists = await Customer.findOne({ where: { phone: data.phone, companyId } });
    if (phoneExists) throw new ConflictError('A customer with this phone already exists');

    // Generate code
    const company = await require('../models').Company.findByPk(companyId);
    const lastCode = await customerRepository.findLastCode(companyId);
    const code = this._generateCode(company?.code, lastCode);

    // Normalize tags
    const tags = data.tags;
    if (typeof tags === 'string') {
      try { data.tags = JSON.parse(tags); } catch { data.tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }

    const customer = await Customer.create({
      id: uuidv4(),
      ...data,
      code,
      companyId,
      createdBy: userId,
      updatedBy: userId,
      registrationDate: data.registrationDate || new Date(),
    });

    // Create loyalty account automatically
    const accountNumber = `LY-${code}`;
    const loyaltyAccount = await LoyaltyAccount.create({
      id: uuidv4(),
      companyId,
      customerId: customer.id,
      accountNumber,
      enrolledDate: new Date(),
    });

    // Auto-assign Standard tier if available
    const standardTier = await MembershipTier.findOne({
      where: { companyId, code: 'standard', isActive: true },
    });
    if (standardTier) {
      loyaltyAccount.membershipId = standardTier.id;
      await loyaltyAccount.save();

      await CustomerMembership.create({
        id: uuidv4(),
        companyId,
        customerId: customer.id,
        tierId: standardTier.id,
        startDate: new Date(),
        status: 'active',
        notes: 'Auto-assigned on registration',
      });
    }

    return await customerRepository.findById(customer.id, companyId);
  }

  async update(id, data, companyId, userId) {
    const customer = await Customer.findOne({ where: { id, companyId } });
    if (!customer) throw new NotFoundError('Customer not found');

    // Check email uniqueness
    if (data.email && data.email !== customer.email) {
      const emailExists = await Customer.findOne({ where: { email: data.email, companyId, id: { [Op.ne]: id } } });
      if (emailExists) throw new ConflictError('Email already in use by another customer');
    }
    if (data.phone && data.phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ where: { phone: data.phone, companyId, id: { [Op.ne]: id } } });
      if (phoneExists) throw new ConflictError('Phone already in use by another customer');
    }

    // Normalize tags
    if (data.tags && typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags); } catch { data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean); }
    }

    data.updatedBy = userId;
    await customer.update(data);
    return await customerRepository.findById(id, companyId);
  }

  async delete(id, companyId) {
    const customer = await Customer.findOne({ where: { id, companyId } });
    if (!customer) throw new NotFoundError('Customer not found');

    // Deactivate loyalty account
    await LoyaltyAccount.update({ isActive: false }, { where: { customerId: id } });

    await customer.destroy();
  }

  async toggleStatus(id, companyId) {
    const customer = await Customer.findOne({ where: { id, companyId } });
    if (!customer) throw new NotFoundError('Customer not found');
    customer.isActive = !customer.isActive;
    await customer.save();

    // Also toggle loyalty account
    await LoyaltyAccount.update({ isActive: customer.isActive }, { where: { customerId: id } });

    return customer;
  }

  async mergeCustomers(primaryId, secondaryId, companyId) {
    return await customerRepository.mergeCustomers(primaryId, secondaryId, companyId);
  }

  async getCustomerWallet(customerId, companyId) {
    const customer = await customerRepository.findById(customerId, companyId);
    return {
      customerId: customer.id,
      customerCode: customer.code,
      customerName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      loyaltyAccount: customer.loyaltyAccount ? {
        accountNumber: customer.loyaltyAccount.accountNumber,
        availablePoints: customer.loyaltyAccount.availablePoints,
        pendingPoints: customer.loyaltyAccount.pendingPoints,
        expiredPoints: customer.loyaltyAccount.expiredPoints,
        redeemedPoints: customer.loyaltyAccount.redeemedPoints,
        lifetimeEarned: customer.loyaltyAccount.lifetimeEarned,
        lifetimeRedeemed: customer.loyaltyAccount.lifetimeRedeemed,
        membershipTier: customer.loyaltyAccount.membership?.name || 'Standard',
      } : null,
    };
  }
}

module.exports = new CustomerService();
