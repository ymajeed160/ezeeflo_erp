const { Campaign, Coupon } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');

class CampaignService {
  async getAll(companyId, { page = 1, limit = 20, status, campaignType, search, isActive } = {}) {
    const where = { companyId };
    if (status) where.status = status;
    if (campaignType) where.campaignType = campaignType;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Campaign.findAndCountAll({
      where,
      include: [{ model: Coupon, as: 'coupons', attributes: ['id', 'code'], required: false }],
      limit: parseInt(limit) || 20, offset,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      distinct: true,
    });

    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getById(id, companyId) {
    const campaign = await Campaign.findOne({ where: { id, companyId }, include: [{ model: Coupon, as: 'coupons', required: false }] });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return campaign;
  }

  async create(data, companyId) {
    const existing = await Campaign.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Campaign code already exists');
    if (data.rules && typeof data.rules === 'string') { try { data.rules = JSON.parse(data.rules); } catch { data.rules = {}; } }
    return await Campaign.create({ id: uuidv4(), ...data, companyId });
  }

  async update(id, data, companyId) {
    const campaign = await Campaign.findOne({ where: { id, companyId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (data.rules && typeof data.rules === 'string') { try { data.rules = JSON.parse(data.rules); } catch {} }
    await campaign.update(data);
    return campaign;
  }

  async delete(id, companyId) {
    const campaign = await Campaign.findOne({ where: { id, companyId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status === 'active') throw new ValidationError('Cannot delete an active campaign. Pause or end it first.');
    await campaign.destroy();
  }

  async updateStatus(id, status, companyId) {
    const validStatuses = ['draft', 'active', 'paused', 'ended', 'canceled'];
    if (!validStatuses.includes(status)) throw new ValidationError('Invalid status');
    const campaign = await Campaign.findOne({ where: { id, companyId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    campaign.status = status;
    if (status === 'ended' || status === 'canceled') campaign.isActive = false;
    await campaign.save();
    return campaign;
  }

  async getActiveCampaigns(companyId) {
    const now = new Date();
    return await Campaign.findAll({
      where: {
        companyId, status: 'active', isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
      order: [['priority', 'DESC']],
    });
  }
}

module.exports = new CampaignService();
