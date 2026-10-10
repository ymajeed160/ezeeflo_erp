'use strict';
const {
  Item,
  ItemVariant,
  ItemVariantAttributeValue,
  ItemAttribute,
  ItemAttributeOption,
  ItemAttributeTemplateAttribute,
  InventoryBalance,
  NumberSeries,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

const VARIANT_NUMBER_SERIES = 'item_variant';

/**
 * ItemVariantService
 * Variant creation, matching, SKU generation and stock lookup.
 *
 * Variant identity is deterministic:
 *  - configurationKey = normalized, sorted "code:value" pairs of the
 *    variant-defining attributes only (DB unique per tenant+item).
 *  - description = parent name + display values in stable attribute order.
 *  - sku = <parent itemCode>-<6-digit sequence> via NumberSeries.
 */
class ItemVariantService {
  // ────────────────────────────────────────────────────────────
  // Attribute resolution
  // ────────────────────────────────────────────────────────────
  async getApplicableAttributes(itemId, tenantId) {
    const item = await Item.findOne({
      where: { id: itemId, tenantId },
      include: [
        {
          model: require('../models').ItemAttributeTemplate,
          as: 'attributeTemplate',
          required: false,
        },
      ],
    });
    if (!item) throw new NotFoundError('Item not found');

    const attributes = [];

    if (item.attributeTemplateId && item.attributeTemplate) {
      const links = await ItemAttributeTemplateAttribute.findAll({
        where: { templateId: item.attributeTemplateId, tenantId },
        order: [['display_order', 'ASC'], ['created_at', 'ASC']],
        include: [
          {
            model: ItemAttribute,
            as: 'attribute',
            required: true,
            include: [{ model: ItemAttributeOption, as: 'options', required: false }],
          },
        ],
      });
      for (const link of links) {
        const attr = link.attribute;
        attributes.push(this._shapeAttribute(attr, link));
      }
    }

    return { item, attributes };
  }

  _shapeAttribute(attr, link = null) {
    return {
      attributeId: attr.id,
      code: attr.code,
      name: attr.name,
      dataType: attr.dataType,
      isRequired: link ? !!link.isRequired : attr.isRequired,
      isVariantDefining: link ? !!link.isVariantDefining : attr.isVariantDefining,
      displayOrder: link ? (link.displayOrder || 0) : (attr.displayOrder || 0),
      options: (attr.options || []).filter(o => o.isActive).map(o => ({
        optionId: o.id,
        value: o.value,
        displayOrder: o.displayOrder,
      })).sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }

  // ────────────────────────────────────────────────────────────
  // Normalization & keys
  // ────────────────────────────────────────────────────────────
  _normalizeValue(raw) {
    return String(raw == null ? '' : raw).trim().toLowerCase();
  }

  /**
   * Validate and normalize user-supplied attribute values against the
   * applicable attributes. Returns ordered, normalized entries.
   *
   * @param {Array} attributes - shaped applicable attributes
   * @param {Object|Array} input - { attributeId: value|{optionId,value} } or
   *        array of { attributeId, optionId, value }
   */
  normalizeConfiguration(attributes, input) {
    const byId = new Map(attributes.map(a => [a.attributeId, a]));
    const map = {};

    if (Array.isArray(input)) {
      for (const row of input) {
        map[row.attributeId] = row;
      }
    } else if (input && typeof input === 'object') {
      Object.assign(map, input);
    }

    const normalized = [];
    const missing = [];

    // Keep deterministic order by displayOrder then code.
    const ordered = [...attributes].sort((a, b) => (a.displayOrder - b.displayOrder) || a.code.localeCompare(b.code));

    for (const attr of ordered) {
      const raw = map[attr.attributeId];
      const hasValue = raw !== undefined && raw !== null &&
        (typeof raw === 'object' ? (raw.value != null && String(raw.value).trim() !== '') || raw.optionId != null : String(raw).trim() !== '');

      if (!hasValue) {
        if (attr.isRequired) missing.push(attr.name);
        continue;
      }

      let value = null;
      let optionId = null;
      let displayValue = null;

      if (typeof raw === 'object') {
        optionId = raw.optionId || null;
        value = raw.value != null ? String(raw.value).trim() : null;
      } else {
        value = String(raw).trim();
      }

      if (attr.dataType === 'dropdown') {
        if (optionId) {
          const opt = attr.options.find(o => o.optionId === optionId);
          if (!opt) throw new BadRequestError(`Invalid option for attribute "${attr.name}"`);
          value = opt.value;
          displayValue = opt.value;
        } else if (value) {
          const opt = attr.options.find(o => o.value.toLowerCase() === value.toLowerCase());
          if (!opt) throw new BadRequestError(`Value "${value}" is not a valid option for attribute "${attr.name}"`);
          optionId = opt.optionId;
          value = opt.value;
          displayValue = opt.value;
        }
      } else {
        if (attr.dataType === 'number' && value !== null && value !== '' && isNaN(Number(value))) {
          throw new BadRequestError(`Attribute "${attr.name}" must be a number`);
        }
        displayValue = value;
      }

      if (value === null || value === '') continue;

      normalized.push({
        attributeId: attr.attributeId,
        code: attr.code,
        name: attr.name,
        dataType: attr.dataType,
        isVariantDefining: attr.isVariantDefining,
        displayOrder: attr.displayOrder,
        optionId,
        value,
        displayValue,
      });
    }

    if (missing.length) {
      throw new BadRequestError(`Required attributes missing: ${missing.join(', ')}`);
    }

    return normalized;
  }

  computeConfigurationKey(normalized) {
    const defining = normalized
      .filter(v => v.isVariantDefining)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.code.localeCompare(b.code));
    const raw = defining
      .map(v => `${v.code}:${v.optionId || this._normalizeValue(v.value)}`)
      .join('|');
    // Store a fixed-length hash so the key never exceeds column length,
    // while remaining deterministic and unique per configuration.
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  buildDescription(item, normalized) {
    const parts = [item.name];
    const ordered = [...normalized].sort((a, b) => (a.displayOrder - b.displayOrder) || a.code.localeCompare(b.code));
    for (const v of ordered) {
      if (v.displayValue) parts.push(v.displayValue);
    }
    return parts.join(' ');
  }

  // ────────────────────────────────────────────────────────────
  // SKU generation
  // ────────────────────────────────────────────────────────────
  async generateSku(tenantId, item, transaction) {
    const prefix = `${item.itemCode}-`;
    const [rows] = await sequelize.query(
      `SELECT id, next_number, number_length, pad_zero, prefix, suffix
         FROM number_series
        WHERE tenant_id = ? AND series_name = ?
        FOR UPDATE`,
      { replacements: [tenantId, VARIANT_NUMBER_SERIES], transaction }
    );

    let current;
    if (!rows || rows.length === 0) {
      // Seed the series: first number used is 1.
      await sequelize.query(
        `INSERT INTO number_series
           (tenant_id, series_name, prefix, suffix, next_number, number_length, pad_zero, reset_period, created_at, updated_at)
         VALUES (?, ?, ?, '', 2, 6, 1, 'none', NOW(), NOW())`,
        { replacements: [tenantId, VARIANT_NUMBER_SERIES, prefix], transaction }
      );
      current = 1;
    } else {
      const row = rows[0];
      current = parseInt(row.next_number, 10) || 1;
      await sequelize.query(
        `UPDATE number_series SET next_number = next_number + 1, updated_at = NOW() WHERE id = ?`,
        { replacements: [row.id], transaction }
      );
    }

    const length = 6;
    return `${prefix}${String(current).padStart(length, '0')}`;
  }

  // ────────────────────────────────────────────────────────────
  // Find or create
  // ────────────────────────────────────────────────────────────
  /**
   * Resolve (reuse) or create a variant for a configuration.
   * Runs inside a transaction; the DB unique index on
   * (tenant_id, item_id, configuration_key) guards against duplicates.
   *
   * @param {Object} opts
   * @param {string} opts.itemId
   * @param {Array|Object} opts.attributeValues
   * @param {Object} [opts.prices] { costPrice, sellingPrice }
   */
  async findOrCreate({ itemId, attributeValues, prices = {}, tenantId, userId }) {
    const { item, attributes } = await this.getApplicableAttributes(itemId, tenantId);
    if (!item.isVariantEnabled) {
      throw new BadRequestError('Item does not support variants');
    }
    if (!attributes.length) {
      throw new BadRequestError('No attributes are configured for this item');
    }

    const normalized = this.normalizeConfiguration(attributes, attributeValues);
    const configurationKey = this.computeConfigurationKey(normalized);
    if (!configurationKey) {
      throw new BadRequestError('At least one variant-defining attribute value is required');
    }
    const description = this.buildDescription(item, normalized);

    const t = await sequelize.transaction();
    try {
      let variant = await ItemVariant.findOne({
        where: { tenantId, itemId, configurationKey },
        transaction: t,
        lock: t.LOCK.UPDATE,
        include: [
          {
            model: ItemVariantAttributeValue,
            as: 'attributeValues',
            required: false,
            include: [{ model: ItemAttribute, as: 'attribute' }],
          },
        ],
      });

      if (variant) {
        if (prices.costPrice !== undefined) variant.costPrice = prices.costPrice;
        if (prices.sellingPrice !== undefined) variant.sellingPrice = prices.sellingPrice;
        await variant.save({ transaction: t });
        await t.commit();
        return this._serialize(variant);
      }

      const sku = await this.generateSku(tenantId, item, t);
      variant = await ItemVariant.create({
        tenantId,
        itemId,
        sku,
        configurationKey,
        description,
        costPrice: prices.costPrice !== undefined ? prices.costPrice : item.costPrice,
        sellingPrice: prices.sellingPrice !== undefined ? prices.sellingPrice : item.sellingPrice,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      }, { transaction: t });

      for (const v of normalized) {
        await ItemVariantAttributeValue.create({
          tenantId,
          variantId: variant.id,
          attributeId: v.attributeId,
          optionId: v.optionId || null,
          value: v.value,
          displayValue: v.displayValue,
        }, { transaction: t });
      }

      await t.commit();
      logger.info(`Variant created: ${sku} for item ${item.itemCode} by ${userId}`);
      return this.getById(variant.id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // ────────────────────────────────────────────────────────────
  // Queries
  // ────────────────────────────────────────────────────────────
  _serialize(variant) {
    if (!variant) return null;
    const data = variant.toJSON ? variant.toJSON() : variant;
    return data;
  }

  async getById(id, tenantId) {
    const variant = await ItemVariant.findOne({
      where: { id, tenantId },
      include: [
        { model: Item, as: 'item', required: false },
        {
          model: ItemVariantAttributeValue,
          as: 'attributeValues',
          required: false,
          include: [
            { model: ItemAttribute, as: 'attribute', required: false },
            { model: ItemAttributeOption, as: 'option', required: false },
          ],
        },
      ],
    });
    if (!variant) throw new NotFoundError('Variant not found');
    return variant;
  }

  async listByItem(itemId, tenantId, query = {}) {
    const { page = 1, limit = 20, search, isActive } = query;
    const where = { tenantId, itemId };
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await ItemVariant.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      distinct: true,
      order: [['created_at', 'DESC']],
      include: [
        { model: Item, as: 'item', required: false },
        {
          model: ItemVariantAttributeValue,
          as: 'attributeValues',
          required: false,
          include: [
            { model: ItemAttribute, as: 'attribute', required: false },
            { model: ItemAttributeOption, as: 'option', required: false },
          ],
        },
      ],
    });

    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: result.count,
        totalPages: Math.ceil(result.count / parseInt(limit, 10)),
        hasNext: parseInt(page, 10) * parseInt(limit, 10) < result.count,
        hasPrev: parseInt(page, 10) > 1,
      },
    };
  }

  /**
   * Server-side variant search for sales / procurement item pickers.
   */
  async search(tenantId, query = {}) {
    const { q, itemId, warehouseId, page = 1, limit = 20 } = query;
    const where = { tenantId };
    if (itemId) where.itemId = itemId;
    if (q) {
      where[Op.or] = [
        { sku: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { '$item.name$': { [Op.like]: `%${q}%` } },
        { '$item.item_code$': { [Op.like]: `%${q}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await ItemVariant.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      distinct: true,
      order: [['sku', 'ASC']],
      include: [
        { model: Item, as: 'item', required: false },
        {
          model: ItemVariantAttributeValue,
          as: 'attributeValues',
          required: false,
          include: [
            { model: ItemAttribute, as: 'attribute', required: false },
            { model: ItemAttributeOption, as: 'option', required: false },
          ],
        },
      ],
      subQuery: false,
    });

    const rows = result.rows.map(v => {
      const json = v.toJSON();
      json.availableStock = null;
      return json;
    });

    // Attach stock when a warehouse is specified.
    if (warehouseId) {
      const balances = await InventoryBalance.findAll({
        where: { tenantId, warehouseId, variantId: { [Op.in]: rows.map(r => r.id) } },
      });
      const byVariant = new Map(balances.map(b => [b.variantId, parseFloat(b.quantityOnHand) || 0]));
      for (const r of rows) r.availableStock = byVariant.has(r.id) ? byVariant.get(r.id) : 0;
    }

    return {
      rows,
      count: result.count,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: result.count,
        totalPages: Math.ceil(result.count / parseInt(limit, 10)),
        hasNext: parseInt(page, 10) * parseInt(limit, 10) < result.count,
        hasPrev: parseInt(page, 10) > 1,
      },
    };
  }

  async getStock(tenantId, variantId, warehouseId) {
    const balance = await InventoryBalance.findOne({ where: { tenantId, variantId, warehouseId } });
    return balance ? parseFloat(balance.quantityOnHand) : 0;
  }

  async toggleStatus(id, tenantId, userId) {
    const variant = await ItemVariant.findOne({ where: { id, tenantId } });
    if (!variant) throw new NotFoundError('Variant not found');
    await variant.update({ isActive: !variant.isActive, updatedBy: userId });
    return this.getById(id, tenantId);
  }

  async remove(id, tenantId) {
    const variant = await ItemVariant.findOne({ where: { id, tenantId } });
    if (!variant) throw new NotFoundError('Variant not found');

    const { InventoryTransaction } = require('../models');
    const used = await InventoryTransaction.count({ where: { variantId: id, tenantId } });
    if (used > 0) {
      throw new ConflictError('Variant is referenced by inventory transactions and cannot be deleted');
    }

    await variant.destroy();
    return true;
  }
}

module.exports = new ItemVariantService();
