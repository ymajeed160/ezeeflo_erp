const { Op } = require('sequelize');
const { SellingResourceType } = require('../models');
const { NotFoundError } = require('../utils/appError');

class SellingResourceTypeRepository {
  async findAll({ tenantId, query = {} }) {
    const { search, isActive, page = 1, limit = 100 } = query;
    const where = { tenantId };

    if (search) {
      where[Op.or] = [
        { typeCode: { [Op.like]: `%${search}%` } },
        { typeName: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await SellingResourceType.findAndCountAll({
      where,
      order: [['typeName', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findById(id, tenantId) {
    const type = await SellingResourceType.findOne({ where: { id, tenantId } });
    if (!type) throw new NotFoundError('Selling Resource Type not found');
    return type;
  }

  async findByCode(typeCode, tenantId, excludeId = null) {
    const where = { typeCode, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return SellingResourceType.findOne({ where, paranoid: false });
  }

  async getNextTypeCode(tenantId) {
    // Use paranoid:false so soft-deleted rows never cause code collisions
    const last = await SellingResourceType.findOne({
      where: { tenantId, typeCode: { [Op.like]: 'RT-%' } },
      attributes: ['typeCode'],
      order: [['typeCode', 'DESC']],
      paranoid: false,
    });

    let nextNumber = 1;
    if (last && last.typeCode) {
      const match = String(last.typeCode).match(/RT-(\d+)/i);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    return `RT-${String(nextNumber).padStart(6, '0')}`;
  }

  async create(data) {
    return SellingResourceType.create(data);
  }

  async update(id, data, tenantId) {
    const type = await this.findById(id, tenantId);
    const updatableFields = ['typeName', 'description', 'isActive', 'updatedBy'];
    updatableFields.forEach((field) => {
      if (data[field] !== undefined) type[field] = data[field];
    });
    if (data.typeCode !== undefined) type.typeCode = data.typeCode;
    await type.save();
    return this.findById(id, tenantId);
  }

  async delete(id, tenantId) {
    const type = await this.findById(id, tenantId);
    await type.destroy();
    return true;
  }
}

module.exports = new SellingResourceTypeRepository();
