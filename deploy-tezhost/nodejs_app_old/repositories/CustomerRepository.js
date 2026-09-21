const { Op } = require('sequelize');
const { Customer, Account, User } = require('../models');
const { NotFoundError } = require('../utils/appError');

class CustomerRepository {
  async findAll({ tenantId, query = {} }) {
    const {
      search,
      status,
      isActive,
      group,
      type,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const where = { tenantId };

    // Search
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { taxNumber: { [Op.like]: `%${search}%` } },
        { vatNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filters
    if (status) where.status = status;
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (group) where.group = group;
    if (type) where.type = type;

    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        { model: Account, as: 'arAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit, 10),
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id, tenantId) {
    const customer = await Customer.findOne({
      where: { id, tenantId },
      include: [
        { model: Account, as: 'arAccount', attributes: ['id', 'code', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async findByCode(code, tenantId, excludeId = null) {
    const where = { code, tenantId };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return Customer.findOne({ where });
  }

  async create(data) {
    return Customer.create(data);
  }

  async update(id, data, tenantId) {
    const customer = await this.findById(id, tenantId);
    const updatableFields = [
      'name', 'legalName', 'group', 'type', 'email', 'phone', 'mobile',
      'website', 'taxNumber', 'vatNumber', 'registrationNumber', 'currency',
      'paymentTerms', 'creditLimit', 'creditDays', 'arAccountId',
      'billingAddress', 'shippingAddress', 'city', 'state', 'country',
      'postalCode', 'contactPerson', 'contactEmail', 'contactPhone',
      'notes', 'status', 'isActive', 'updatedBy',
    ];

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) {
        customer[field] = data[field];
      }
    });

    await customer.save();

    // Reload with associations
    return this.findById(id, tenantId);
  }

  async delete(id, tenantId) {
    const customer = await this.findById(id, tenantId);
    await customer.destroy();
    return true;
  }

  async toggleStatus(id, tenantId, updatedBy) {
    const customer = await this.findById(id, tenantId);
    customer.isActive = !customer.isActive;
    customer.updatedBy = updatedBy;
    await customer.save();
    return customer;
  }

  async findPaginatedForSelect(tenantId, search = '') {
    const where = {
      tenantId,
      isActive: true,
      status: 'active',
    };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }

    return Customer.findAll({
      where,
      attributes: ['id', 'code', 'name', 'email', 'phone', 'mobile', 'paymentTerms', 'creditLimit', 'currency'],
      order: [['name', 'ASC']],
      limit: 50,
    });
  }
}

module.exports = new CustomerRepository();