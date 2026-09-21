const BaseRepository = require('./BaseRepository');
const { Item, ItemCategory, Account } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ItemRepository extends BaseRepository {
  constructor() {
    super(Item);
  }

  async findByItemCode(itemCode, tenantId) {
    const where = { itemCode, tenantId };
    return await this.model.findOne({ where });
  }

  /**
   * Find all items for a tenant with optional filters and includes
   */
  async findAll(tenantId, filters = {}, options = {}) {
    const where = { tenantId, ...filters };

    const defaultInclude = [
      {
        model: ItemCategory,
        as: 'category',
        attributes: ['id', 'name'],
        required: false,
      },
    ];

    const queryOptions = {
      where,
      include: options.include || defaultInclude,
      order: options.order || [['item_code', 'ASC']],
      ...options,
    };

    return await this.model.findAll(queryOptions);
  }

  /**
   * Find items with pagination, filtering, and category include
   */
  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['item_code', 'ASC']], search = '' } = {}) {
    const where = { tenantId };

    // Apply exact-match filters
    if (filters.itemType) where.itemType = filters.itemType;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isInventoryTracked !== undefined) where.isInventoryTracked = filters.isInventoryTracked;

    // Apply partial-match filters for spec fields
    const specFields = ['model', 'ram', 'processor', 'ssd', 'generation', 'colour'];
    specFields.forEach(field => {
      if (filters[field]) where[field] = { [Op.like]: `%${filters[field]}%` };
    });

    // Apply search across item_code, name, and spec fields
    if (search) {
      where[Op.or] = [
        { itemCode: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { ram: { [Op.like]: `%${search}%` } },
        { processor: { [Op.like]: `%${search}%` } },
        { ssd: { [Op.like]: `%${search}%` } },
        { generation: { [Op.like]: `%${search}%` } },
        { colour: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: ItemCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });

    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
        hasNext: page * limit < result.count,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find item by ID with all accounting relations populated
   */
  async findById(id, tenantId = null, options = {}) {
    const where = { id };
    if (tenantId) where.tenantId = tenantId;

    return await this.model.findOne({
      where,
      include: [
        {
          model: ItemCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Account,
          as: 'incomeAccount',
          attributes: ['id', 'name', 'code', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'expenseAccount',
          attributes: ['id', 'name', 'code', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'inventoryAccount',
          attributes: ['id', 'name', 'code', 'type'],
          required: false,
        },
      ],
      ...options,
    });
  }

  /**
   * Update item and return it with all associations populated
   */
  async update(id, data, tenantId = null, userId = null) {
    const where = { id };
    if (tenantId) where.tenantId = tenantId;

    const payload = { ...data };
    if (userId) payload.updatedBy = userId;

    const [affectedCount] = await this.model.update(payload, { where });
    if (affectedCount === 0) return null;

    return await this.findById(id, tenantId);
  }

  /**
   * Find items by type (product or service)
   */
  async findByType(itemType, tenantId) {
    return await this.model.findAll({
      where: { itemType, tenantId },
      include: [
        {
          model: ItemCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Find items by category
   */
  async findByCategory(categoryId, tenantId) {
    return await this.model.findAll({
      where: { categoryId, tenantId },
      include: [
        {
          model: ItemCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Search items across code and name
   */
  async search(tenantId, searchTerm, filters = {}) {
    return await this.model.findAll({
      where: {
        tenantId,
        ...filters,
        [Op.or]: [
          { itemCode: { [Op.like]: `%${searchTerm}%` } },
          { name: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      include: [
        {
          model: ItemCategory,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['item_code', 'ASC']],
    });
  }
}

module.exports = new ItemRepository();