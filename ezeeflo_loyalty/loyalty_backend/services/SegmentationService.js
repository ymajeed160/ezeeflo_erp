const { CustomerSegment, Customer, LoyaltyAccount, PointTransaction } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op, Sequelize } = require('sequelize');

class SegmentationService {
  async getAll(companyId) {
    return await CustomerSegment.findAll({ where: { companyId }, order: [['name', 'ASC']] });
  }

  async getById(id, companyId) {
    const seg = await CustomerSegment.findOne({ where: { id, companyId } });
    if (!seg) throw new (require('../utils/appError').NotFoundError)('Segment not found');
    return seg;
  }

  async create(data, companyId, userId) {
    const existing = await CustomerSegment.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new (require('../utils/appError').ConflictError)('Segment code already exists');
    if (typeof data.filters === 'string') { try { data.filters = JSON.parse(data.filters); } catch { data.filters = []; } }
    const segment = await CustomerSegment.create({ id: uuidv4(), ...data, companyId, createdBy: userId });
    if (data.segmentType === 'dynamic') await this.refreshSegment(segment.id, companyId);
    return segment;
  }

  async update(id, data, companyId) {
    const seg = await CustomerSegment.findOne({ where: { id, companyId } });
    if (!seg) throw new (require('../utils/appError').NotFoundError)('Segment not found');
    if (typeof data.filters === 'string') { try { data.filters = JSON.parse(data.filters); } catch {} }
    await seg.update(data);
    if (seg.segmentType === 'dynamic') await this.refreshSegment(seg.id, companyId);
    return seg;
  }

  async delete(id, companyId) {
    const seg = await CustomerSegment.findOne({ where: { id, companyId } });
    if (!seg) throw new (require('../utils/appError').NotFoundError)('Segment not found');
    await seg.destroy();
  }

  async refreshSegment(id, companyId) {
    const seg = await CustomerSegment.findOne({ where: { id, companyId } });
    if (!seg || !seg.filters || seg.filters.length === 0) return;

    const where = { companyId, isActive: true };
    for (const filter of seg.filters) {
      this._applyFilter(where, filter);
    }

    const count = await Customer.count({ where });
    seg.customerCount = count;
    seg.lastRefreshedAt = new Date();
    await seg.save();
    return { count, segment: seg };
  }

  _applyFilter(where, filter) {
    const { field, operator, value } = filter;
    const sequelizeOp = {
      equals: Op.eq, not_equals: Op.ne, greater_than: Op.gt, less_than: Op.lt,
      greater_or_equal: Op.gte, less_or_equal: Op.lte, in: Op.in, not_in: Op.notIn,
      contains: Op.like, starts_with: Op.startsWith,
    }[operator];

    if (sequelizeOp) {
      if (operator === 'contains') {
        where[field] = { [Op.like]: `%${value}%` };
      } else if (operator === 'starts_with') {
        where[field] = { [Op.startsWith]: value };
      } else {
        where[field] = { [sequelizeOp]: value };
      }
    }
  }

  async getSegmentCustomers(id, companyId, { page = 1, limit = 20 } = {}) {
    const seg = await CustomerSegment.findOne({ where: { id, companyId } });
    if (!seg) throw new (require('../utils/appError').NotFoundError)('Segment not found');

    const where = { companyId, isActive: true };
    if (seg.filters && seg.filters.length > 0) {
      for (const filter of seg.filters) this._applyFilter(where, filter);
    }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [{ model: LoyaltyAccount, as: 'loyaltyAccount', attributes: ['id', 'availablePoints', 'currentTierPoints'], required: false }],
      limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']],
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)) } };
  }
}

module.exports = new SegmentationService();
