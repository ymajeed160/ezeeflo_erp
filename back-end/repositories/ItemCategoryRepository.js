const BaseRepository = require('./BaseRepository');
const { ItemCategory } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ItemCategoryRepository extends BaseRepository {
  constructor() {
    super(ItemCategory);
  }

  async findByName(name, tenantId) {
    const where = { name, tenantId };
    return await this.model.findOne({ where });
  }

  async findChildren(parentCategoryId, tenantId) {
    return await this.model.findAll({
      where: { parentCategoryId, tenantId },
      order: [['name', 'ASC']],
    });
  }

  async findRoots(tenantId) {
    return await this.model.findAll({
      where: { parentCategoryId: null, tenantId },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Fetch all categories for a tenant (flat list)
   * Used for building tree structures
   */
  async findTree(tenantId) {
    const categories = await this.model.findAll({
      where: { tenantId },
      order: [['name', 'ASC']],
    });
    return categories;
  }

  /**
   * Find all descendant category IDs for a given parent
   * (used for circular reference detection and cascade operations)
   */
  async findWithDescendants(parentCategoryId, tenantId) {
    const allCategories = await this.model.findAll({
      where: { tenantId },
      attributes: ['id', 'parentCategoryId', 'name', 'isActive'],
    });

    const descendantIds = this._collectDescendantIds(allCategories, parentCategoryId);
    return allCategories.filter(c => descendantIds.has(c.id));
  }

  _collectDescendantIds(categories, parentId, collected = new Set()) {
    const children = categories.filter(c => c.parentCategoryId === parentId);
    children.forEach(child => {
      collected.add(child.id);
      this._collectDescendantIds(categories, child.id, collected);
    });
    return collected;
  }

  /**
   * Search categories by name (case-insensitive)
   */
  async search(tenantId, searchTerm) {
    return await this.model.findAll({
      where: {
        tenantId,
        name: { [Op.like]: `%${searchTerm}%` },
      },
      order: [['name', 'ASC']],
    });
  }
}

module.exports = new ItemCategoryRepository();