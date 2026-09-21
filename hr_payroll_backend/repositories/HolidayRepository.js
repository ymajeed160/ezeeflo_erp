const { Op } = require('sequelize');
const { Holiday } = require('../models');

class HolidayRepository {
  async findAll({ tenantId, query = {} }) {
    const { page = 1, limit = 20, search = '', year, holidayType } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (holidayType) where.holidayType = holidayType;
    if (year) where.holidayDate = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { nameAr: { [Op.like]: `%${search}%` } }];
    const { count, rows } = await Holiday.findAndCountAll({ where, order: [['holidayDate', 'ASC']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  }
  async findById(id, tenantId) { return Holiday.findOne({ where: { id, tenantId } }); }
  async findByDate(date, tenantId, excludeId = null) { const where = { holidayDate: date, tenantId }; if (excludeId) where.id = { [Op.ne]: excludeId }; return Holiday.findOne({ where }); }
  async create(data) { return Holiday.create(data); }
  async update(id, tenantId, data) { const h = await Holiday.findOne({ where: { id, tenantId } }); if (!h) return null; return h.update(data); }
  async delete(id, tenantId) { const h = await Holiday.findOne({ where: { id, tenantId } }); if (!h) return null; return h.destroy(); }
}

module.exports = new HolidayRepository();
