const itemRepository = require('../repositories/ItemRepository');
const itemCategoryRepository = require('../repositories/ItemCategoryRepository');
const { Account } = require('../models');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class ItemService {
  constructor() {
    // Allowed account types for mapping
    this.INCOME_ACCOUNT_TYPES = ['revenue', 'income'];
    this.EXPENSE_ACCOUNT_TYPES = ['expense', 'cost_of_goods_sold'];
    this.INVENTORY_ACCOUNT_TYPES = ['asset'];
  }

  /**
   * Validate an account belongs to the tenant and is of allowed types
   */
  async validateAccount(accountId, tenantId, allowedTypes, fieldName) {
    if (!accountId) return null;

    const account = await Account.findOne({
      where: { id: accountId, tenantId },
    });

    if (!account) {
      throw new BadRequestError(`${fieldName}: Account not found in your tenant`);
    }

    // Validate account type if allowedTypes provided
    if (allowedTypes && !allowedTypes.includes(account.type)) {
      throw new BadRequestError(
        `${fieldName}: Invalid account type "${account.type}". Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    return account;
  }

  async getItems(tenantId, query = {}) {
    const { page = 1, limit = 20, itemType, categoryId, isActive, search, isInventoryTracked } = query;
    const filters = {};

    if (itemType) filters.itemType = itemType;
    if (categoryId) filters.categoryId = categoryId;
    if (isActive !== undefined && isActive !== '') filters.isActive = isActive === 'true' || isActive === true;
    if (isInventoryTracked !== undefined && isInventoryTracked !== '') filters.isInventoryTracked = isInventoryTracked === 'true' || isInventoryTracked === true;

    return await itemRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['item_code', 'ASC']],
    });
  }

  async getItemById(id, tenantId) {
    const item = await itemRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    return item;
  }

  async createItem(data, tenantId, userId) {
    // Validate itemCode uniqueness
    const existing = await itemRepository.findByItemCode(data.itemCode, tenantId);
    if (existing) {
      throw new ConflictError(`Item code "${data.itemCode}" already exists in this tenant`);
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await itemCategoryRepository.findById(data.categoryId, tenantId);
      if (!category) {
        throw new BadRequestError('Item category not found');
      }
    }

    // Apply inventory rules based on item type
    this.validateItemTypeRules(data);

    // Validate accounting integration
    await this.validateAccountingAccounts(data, tenantId);

    const item = await itemRepository.create(data, tenantId, userId);
    logger.info(`Item created: ${item.itemCode} (${item.name}) by user ${userId}`);
    return item;
  }

  async updateItem(id, data, tenantId, userId) {
    const item = await itemRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    // Validate itemCode uniqueness (if changed)
    if (data.itemCode && data.itemCode !== item.itemCode) {
      const existing = await itemRepository.findByItemCode(data.itemCode, tenantId);
      if (existing) {
        throw new ConflictError(`Item code "${data.itemCode}" already exists`);
      }
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await itemCategoryRepository.findById(data.categoryId, tenantId);
      if (!category) {
        throw new BadRequestError('Item category not found');
      }
    }

    // Determine effective item type (updated or existing)
    const effectiveType = data.itemType || item.itemType;

    // Apply inventory rules
    this.validateItemTypeRules({
      ...data,
      itemType: effectiveType,
    });

    // Validate accounting accounts
    await this.validateAccountingAccounts(
      { ...data, itemType: effectiveType },
      tenantId
    );

    const updated = await itemRepository.update(id, data, tenantId, userId);
    logger.info(`Item updated: ${id} (${item.itemCode}) by user ${userId}`);
    return updated;
  }

  async deleteItem(id, tenantId) {
    const item = await itemRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    await itemRepository.delete(id, tenantId, false);
    logger.info(`Item deleted: ${id} (${item.itemCode}) from tenant ${tenantId}`);
    return true;
  }

  async toggleStatus(id, tenantId, userId) {
    const item = await itemRepository.findById(id, tenantId);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    const updated = await itemRepository.update(
      id,
      { isActive: !item.isActive },
      tenantId,
      userId
    );
    logger.info(
      `Item ${item.itemCode} ${updated.isActive ? 'activated' : 'deactivated'} by user ${userId}`
    );
    return updated;
  }

  /**
   * Apply inventory rules:
   * - If ItemType = 'service': No stock tracking, No inventory transactions, InventoryAccountId optional
   * - If ItemType = 'product': Stock tracking available, InventoryAccountId required
   */
  validateItemTypeRules(data) {
    if (data.itemType === 'service') {
      // Services: no inventory tracking
      data.isInventoryTracked = false;
      // inventoryAccountId is optional for services (allow it to be null/undefined)
    } else if (data.itemType === 'product') {
      // Products: inventory tracking should be enabled by default
      if (data.isInventoryTracked === undefined) {
        data.isInventoryTracked = true;
      }
      // inventoryAccountId is required for tracked products
      if (data.isInventoryTracked && !data.inventoryAccountId) {
        throw new BadRequestError('Inventory account is required for inventory-tracked products');
      }
    }

    return data;
  }

  /**
   * Validate accounting accounts integration
   * Ensures all specified accounts belong to the same tenant and are of appropriate types
   */
  async validateAccountingAccounts(data, tenantId) {
    // Validate Income Account
    if (data.incomeAccountId) {
      await this.validateAccount(data.incomeAccountId, tenantId, this.INCOME_ACCOUNT_TYPES, 'Income Account');
    }

    // Validate Expense Account
    if (data.expenseAccountId) {
      await this.validateAccount(data.expenseAccountId, tenantId, this.EXPENSE_ACCOUNT_TYPES, 'Expense Account');
    }

    // Validate Inventory Account (only required for tracked products)
    if (data.inventoryAccountId) {
      await this.validateAccount(data.inventoryAccountId, tenantId, this.INVENTORY_ACCOUNT_TYPES, 'Inventory Account');
    }
  }
}

module.exports = new ItemService();