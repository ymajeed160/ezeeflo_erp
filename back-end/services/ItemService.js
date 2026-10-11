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
    const { page = 1, limit = 20, itemType, categoryId, isActive, search, isInventoryTracked, model, size, ram, processor, ssd, generation, colour } = query;
    const filters = {};

    if (itemType) filters.itemType = itemType;
    if (categoryId) filters.categoryId = categoryId;
    if (isActive !== undefined && isActive !== '') filters.isActive = isActive === 'true' || isActive === true;
    if (isInventoryTracked !== undefined && isInventoryTracked !== '') filters.isInventoryTracked = isInventoryTracked === 'true' || isInventoryTracked === true;
    if (model) filters.model = model;
    if (size) filters.size = size;
    if (ram) filters.ram = ram;
    if (processor) filters.processor = processor;
    if (ssd) filters.ssd = ssd;
    if (generation) filters.generation = generation;
    if (colour) filters.colour = colour;

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

    // Validate attribute template (if variant support requested)
    await this.validateAttributeTemplate(data, tenantId);

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

    // Validate attribute template (if variant support requested)
    await this.validateAttributeTemplate({ ...data, itemType: effectiveType }, tenantId);

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
   * Validate an assigned attribute template belongs to the tenant when variants are enabled.
   */
  async validateAttributeTemplate(data, tenantId) {
    if (data.attributeTemplateId) {
      const { ItemAttributeTemplate } = require('../models');
      const template = await ItemAttributeTemplate.findOne({
        where: { id: data.attributeTemplateId, tenantId },
      });
      if (!template) {
        throw new BadRequestError('Attribute template not found in your tenant');
      }
    }
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

  /**
   * Build the list of selectable items for sales document pickers.
   * Variant-enabled items are expanded into one option per variant so the
   * option carries the variant attributes (and, when a warehouse is given,
   * the on-hand stock for that variant).
   */
  async getSellableOptions(tenantId, query = {}) {
    const { warehouseId } = query;
    const {
      Item, ItemVariant, ItemVariantAttributeValue, ItemAttribute,
      ItemAttributeOption, InventoryBalance,
    } = require('../models');
    const { Op } = require('sequelize');

    const items = await Item.findAll({
      where: { tenantId, isActive: true },
      order: [['itemCode', 'ASC']],
    });

    const variantItemIds = items.filter((item) => item.isVariantEnabled).map((item) => item.id);
    const variantsByItem = new Map();
    if (variantItemIds.length) {
      const variants = await ItemVariant.findAll({
        where: { tenantId, itemId: { [Op.in]: variantItemIds }, isActive: true },
        include: [{
          model: ItemVariantAttributeValue,
          as: 'attributeValues',
          required: false,
          include: [
            { model: ItemAttribute, as: 'attribute', required: false },
            { model: ItemAttributeOption, as: 'option', required: false },
          ],
        }],
        order: [['sku', 'ASC']],
      });
      for (const variant of variants) {
        const list = variantsByItem.get(variant.itemId) || [];
        list.push(variant);
        variantsByItem.set(variant.itemId, list);
      }
    }

    const balanceWhere = { tenantId };
    if (warehouseId) balanceWhere.warehouseId = warehouseId;
    const balances = await InventoryBalance.findAll({ where: balanceWhere });
    const stockByKey = new Map();
    for (const balance of balances) {
      const key = `${balance.itemId}|${balance.variantId || ''}`;
      stockByKey.set(key, (stockByKey.get(key) || 0) + (parseFloat(balance.quantityOnHand) || 0));
    }
    const stockFor = (itemId, variantId) => stockByKey.get(`${itemId}|${variantId || ''}`) || 0;

    const attributeValuesOf = (rows) => (rows || [])
      .map((row) => row.displayValue || row.value || (row.option ? row.option.value : null))
      .filter((value) => value !== null && value !== undefined && value !== '');

    const options = [];
    for (const item of items) {
      const shared = {
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        itemType: item.itemType,
        unitOfMeasure: item.unitOfMeasure,
        isInventoryTracked: item.isInventoryTracked === true,
        isVariantEnabled: item.isVariantEnabled === true,
        sellingPrice: parseFloat(item.sellingPrice) || 0,
        costPrice: parseFloat(item.costPrice) || 0,
        taxPercentage: parseFloat(item.taxPercentage) || 0,
      };

      const variants = item.isVariantEnabled ? (variantsByItem.get(item.id) || []) : [];
      if (variants.length) {
        for (const variant of variants) {
          const values = attributeValuesOf(variant.attributeValues);
          const variantPrice = parseFloat(variant.sellingPrice);
          const variantCost = parseFloat(variant.costPrice);
          options.push({
            ...shared,
            key: `${item.id}|${variant.id}`,
            variantId: variant.id,
            variantSku: variant.sku,
            variantDescription: variant.description || `${item.name} ${values.join(' ')}`.trim(),
            attributeValues: values,
            availableStock: stockFor(item.id, variant.id),
            sellingPrice: variantPrice > 0 ? variantPrice : shared.sellingPrice,
            costPrice: variantCost > 0 ? variantCost : shared.costPrice,
          });
        }
      } else {
        const values = [item.model, item.processor, item.ram, item.ssd, item.size, item.colour, item.generation]
          .filter((value) => value !== null && value !== undefined && value !== '');
        options.push({
          ...shared,
          key: `${item.id}|`,
          variantId: null,
          variantSku: null,
          variantDescription: values.length ? `${item.name} ${values.join(' ')}` : item.name,
          attributeValues: values,
          availableStock: stockFor(item.id, null),
        });
      }
    }

    return options;
  }
}

module.exports = new ItemService();