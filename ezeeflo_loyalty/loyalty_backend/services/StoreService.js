const { Store } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class StoreService {
  async getAll(companyId, { page = 1, limit = 100, search, storeType, region, isActive } = {}) {
    const where = { companyId };
    if (storeType) where.storeType = storeType;
    if (region) where.region = region;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }, { city: { [Op.like]: `%${search}%` } }];

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 100);
    const { count, rows } = await Store.findAndCountAll({
      where,
      include: [{ model: Store, as: 'childStores', attributes: ['id', 'name', 'code'], required: false }],
      limit: parseInt(limit) || 100, offset, order: [['name', 'ASC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 100, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 100)) } };
  }

  async getById(id, companyId) {
    const store = await Store.findOne({ where: { id, companyId }, include: [{ model: Store, as: 'childStores', required: false }] });
    if (!store) throw new (require('../utils/appError').NotFoundError)('Store not found');
    return store;
  }

  async create(data, companyId, userId) {
    return await Store.create({ id: uuidv4(), ...data, companyId, createdBy: userId });
  }

  async update(id, data, companyId) {
    const store = await Store.findOne({ where: { id, companyId } });
    if (!store) throw new (require('../utils/appError').NotFoundError)('Store not found');
    await store.update(data);
    return store;
  }

  async delete(id, companyId) {
    const store = await Store.findOne({ where: { id, companyId } });
    if (!store) throw new (require('../utils/appError').NotFoundError)('Store not found');
    const children = await Store.count({ where: { parentStoreId: id } });
    if (children > 0) throw new (require('../utils/appError').ValidationError)('Cannot delete store with child branches');
    await store.destroy();
  }

  async getRegions(companyId) {
    const stores = await Store.findAll({ where: { companyId }, attributes: ['region'], group: ['region'], raw: true });
    return stores.map(s => s.region).filter(Boolean);
  }
}

module.exports = new StoreService();
