const { Op } = require('sequelize');
const {
  SellingResource,
  SellingResourceType,
  User,
} = require('../models');
const { NotFoundError } = require('../utils/appError');

class SellingResourceRepository {
  async findAll({ tenantId, query = {} }) {
    const {
      search,
      resourceTypeId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = query;

    const where = { tenantId };

    if (search) {
      where[Op.or] = [
        { resourceCode: { [Op.like]: `%${search}%` } },
        { resourceName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (resourceTypeId) where.resourceTypeId = resourceTypeId;
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const offset = (page - 1) * limit;
    const order = sortBy === 'resourceType'
      ? [[{ model: SellingResourceType, as: 'resourceType' }, 'typeName', sortOrder.toUpperCase()]]
      : [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await SellingResource.findAndCountAll({
      where,
      include: [
        { model: SellingResourceType, as: 'resourceType', attributes: ['id', 'typeCode', 'typeName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order,
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
    const resource = await SellingResource.findOne({
      where: { id, tenantId },
      include: [
        { model: SellingResourceType, as: 'resourceType', attributes: ['id', 'typeCode', 'typeName'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });

    if (!resource) throw new NotFoundError('Selling Resource not found');
    return resource;
  }

  async findByCode(resourceCode, tenantId, excludeId = null) {
    const where = { resourceCode, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return SellingResource.findOne({ where, paranoid: false });
  }

  async getNextResourceCode(tenantId) {
    // Use paranoid:false so soft-deleted rows never cause code collisions
    const last = await SellingResource.findOne({
      where: { tenantId, resourceCode: { [Op.like]: 'SR-%' } },
      attributes: ['resourceCode'],
      order: [['resourceCode', 'DESC']],
      paranoid: false,
    });

    let nextNumber = 1;
    if (last && last.resourceCode) {
      const match = String(last.resourceCode).match(/SR-(\d+)/i);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    return `SR-${String(nextNumber).padStart(6, '0')}`;
  }

  async create(data) {
    return SellingResource.create(data);
  }

  async update(id, data, tenantId) {
    const resource = await this.findById(id, tenantId);
    const updatableFields = [
      'resourceName', 'resourceTypeId', 'description', 'isActive', 'updatedBy',
    ];
    updatableFields.forEach((field) => {
      if (data[field] !== undefined) resource[field] = data[field];
    });
    if (data.resourceCode !== undefined) resource.resourceCode = data.resourceCode;
    await resource.save();
    return this.findById(id, tenantId);
  }

  async delete(id, tenantId) {
    const resource = await this.findById(id, tenantId);
    await resource.destroy();
    return true;
  }

  async toggleStatus(id, tenantId, updatedBy) {
    const resource = await this.findById(id, tenantId);
    resource.isActive = !resource.isActive;
    resource.updatedBy = updatedBy;
    await resource.save();
    return this.findById(id, tenantId);
  }

  async findActiveForSelect(tenantId, search = '') {
    const where = { tenantId, isActive: true };
    if (search) {
      where[Op.or] = [
        { resourceCode: { [Op.like]: `%${search}%` } },
        { resourceName: { [Op.like]: `%${search}%` } },
      ];
    }
    return SellingResource.findAll({
      where,
      attributes: ['id', 'resourceCode', 'resourceName', 'resourceTypeId'],
      include: [
        { model: SellingResourceType, as: 'resourceType', attributes: ['id', 'typeCode', 'typeName'] },
      ],
      order: [['resourceName', 'ASC']],
      limit: 50,
    });
  }
}

module.exports = new SellingResourceRepository();
