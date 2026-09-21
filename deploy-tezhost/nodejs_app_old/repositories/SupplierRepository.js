const { Op } = require('sequelize');
const { Supplier, Account, User } = require('../models');
const { NotFoundError } = require('../utils/appError');

class SupplierRepository {
  async findAll({ tenantId, query = {} }) {
    const {
      search,
      status,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const where = { tenantId };

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

    if (status) where.status = status;
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      include: [
        { model: Account, as: 'apAccount', attributes: ['id', 'code', 'name'] },
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
    const supplier = await Supplier.findOne({
      where: { id, tenantId },
      include: [
        { model: Account, as: 'apAccount', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });

    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async findByCode(code, tenantId, excludeId = null) {
    const where = { code, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Supplier.findOne({ where });
  }

  async create(data) {
    return Supplier.create(data);
  }

  async update(id, data, tenantId) {
    const supplier = await this.findById(id, tenantId);
    const updatableFields = [
      'name', 'contactPerson', 'phone', 'mobile', 'email',
      'taxNumber', 'vatNumber', 'address', 'city', 'state', 'country',
      'postalCode', 'paymentTerms', 'creditLimit', 'creditDays', 'currency',
      'apAccountId', 'notes', 'status', 'isActive', 'updatedBy',
    ];

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) supplier[field] = data[field];
    });

    if (data.code !== undefined) supplier.code = data.code;

    await supplier.save();
    return this.findById(id, tenantId);
  }

  async delete(id, tenantId) {
    const supplier = await this.findById(id, tenantId);
    await supplier.destroy();
    return true;
  }

  async toggleStatus(id, tenantId, updatedBy) {
    const supplier = await this.findById(id, tenantId);
    supplier.isActive = !supplier.isActive;
    supplier.updatedBy = updatedBy;
    await supplier.save();
    return supplier;
  }

  async findPaginatedForSelect(tenantId, search = '') {
    const where = { tenantId, isActive: true, status: 'active' };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    return Supplier.findAll({
      where,
      attributes: ['id', 'code', 'name', 'email', 'phone', 'mobile', 'paymentTerms', 'creditLimit', 'currency'],
      order: [['name', 'ASC']],
      limit: 50,
    });
  }
}

module.exports = new SupplierRepository();