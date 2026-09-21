const { Company, CompanySubscription, SubscriptionPlan, SubscriptionModule, User } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class CompanyRepository extends BaseRepository {
  constructor() { super(Company); }
}

class CompanyService {
  constructor() { this.repository = new CompanyRepository(); }

  async getAll({ page, limit, search, status }) {
    const filters = {};
    if (status) filters.status = status;
    if (search) {
      filters[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    return await this.repository.findAndCountAll(null, {
      page: parseInt(page) || 1, limit: parseInt(limit) || 20, filters,
    });
  }

  async getById(companyId) {
    const company = await Company.findByPk(companyId, {
      include: [
        { model: CompanySubscription, as: 'subscriptions', include: [{ model: SubscriptionPlan, as: 'plan' }], required: false },
      ],
    });
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  async create(data) {
    const existing = await Company.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Company code already exists');

    // Create company
    const company = await Company.create({
      id: uuidv4(), ...data,
      status: 'trial',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + (data.trialDays || 14) * 24 * 60 * 60 * 1000),
    });

    // Create default admin user
    const adminPassword = data.adminPassword || 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await User.create({
      companyId: company.id,
      username: data.adminUsername || `admin_${data.code}`,
      email: data.adminEmail || data.email || `admin@${data.code}.com`,
      password: hashedPassword,
      firstName: 'Company',
      lastName: 'Admin',
      isActive: true,
    });

    return { company, adminUser };
  }

  async update(companyId, data) {
    const company = await Company.findByPk(companyId);
    if (!company) throw new NotFoundError('Company not found');
    await company.update(data);
    return company;
  }

  async updateStatus(companyId, status) {
    const validStatuses = ['active', 'inactive', 'suspended', 'trial', 'deleted'];
    if (!validStatuses.includes(status)) throw new ValidationError('Invalid status');
    const company = await Company.findByPk(companyId);
    if (!company) throw new NotFoundError('Company not found');
    company.status = status;
    await company.save();
    return company;
  }

  async delete(companyId) {
    const company = await Company.findByPk(companyId);
    if (!company) throw new NotFoundError('Company not found');
    // Soft delete - set to deleted status
    company.status = 'deleted';
    await company.save();
    await this.repository.delete(companyId);
  }

  async getProfile(companyId) {
    const company = await Company.findByPk(companyId, {
      attributes: { exclude: ['deletedAt'] },
    });
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  async updateProfile(companyId, data) {
    const company = await Company.findByPk(companyId);
    if (!company) throw new NotFoundError('Company not found');
    // Only allow updating safe profile fields
    const allowedFields = ['name', 'email', 'phone', 'website', 'logo',
      'addressLine1', 'addressLine2', 'city', 'state', 'country', 'postalCode',
      'currency', 'currencySymbol', 'timezone', 'settings', 'branding'];
    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    await company.update(updateData);
    return company;
  }
}

module.exports = new CompanyService();
