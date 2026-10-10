'use strict';
const { ItemAttribute, ItemAttributeOption, sequelize } = require('../models');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * ItemAttributeService
 * Manages attribute definitions and their dropdown options.
 */
class ItemAttributeService {
  /**
   * Slugify a code (lowercase, non-alphanumeric -> underscore).
   */
  slugifyCode(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 100);
  }

  async list(tenantId, query = {}) {
    const { page = 1, limit = 50, search, isActive } = query;
    const where = { tenantId };
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true' || isActive === true;

    const { Op } = require('sequelize');
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await ItemAttribute.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['display_order', 'ASC'], ['name', 'ASC']],
      distinct: true,
      include: [{ model: ItemAttributeOption, as: 'options', required: false }],
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

  async getById(id, tenantId) {
    const attr = await ItemAttribute.findOne({
      where: { id, tenantId },
      include: [{ model: ItemAttributeOption, as: 'options', required: false }],
    });
    if (!attr) throw new NotFoundError('Attribute not found');
    return attr;
  }

  async create(data, tenantId, userId) {
    const name = (data.name || '').trim();
    if (!name) throw new BadRequestError('Attribute name is required');

    const code = this.slugifyCode(data.code || name);
    if (!code) throw new BadRequestError('A valid attribute code could not be derived');

    const dataType = data.dataType || 'dropdown';
    if (!['dropdown', 'text', 'number'].includes(dataType)) {
      throw new BadRequestError('dataType must be one of dropdown, text, number');
    }

    const existing = await ItemAttribute.findOne({ where: { tenantId, code } });
    if (existing) throw new ConflictError(`Attribute code "${code}" already exists`);

    const t = await sequelize.transaction();
    try {
      const attr = await ItemAttribute.create({
        tenantId,
        name,
        code,
        dataType,
        isVariantDefining: data.isVariantDefining !== undefined ? !!data.isVariantDefining : true,
        isRequired: data.isRequired !== undefined ? !!data.isRequired : false,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) || 0 : 0,
        isActive: data.isActive !== undefined ? !!data.isActive : true,
        createdBy: userId,
        updatedBy: userId,
      }, { transaction: t });

      if (dataType === 'dropdown' && Array.isArray(data.options)) {
        const seen = new Set();
        let order = 0;
        for (const opt of data.options) {
          const value = typeof opt === 'string' ? opt.trim() : (opt && opt.value ? String(opt.value).trim() : '');
          if (!value) continue;
          if (seen.has(value.toLowerCase())) continue;
          seen.add(value.toLowerCase());
          await ItemAttributeOption.create({
            tenantId,
            attributeId: attr.id,
            value,
            displayOrder: order++,
            isActive: true,
          }, { transaction: t });
        }
      }

      await t.commit();
      return this.getById(attr.id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async update(id, data, tenantId, userId) {
    const attr = await ItemAttribute.findOne({ where: { id, tenantId } });
    if (!attr) throw new NotFoundError('Attribute not found');

    const payload = { updatedBy: userId };
    if (data.name !== undefined) payload.name = (data.name || '').trim();
    if (data.dataType !== undefined) {
      if (!['dropdown', 'text', 'number'].includes(data.dataType)) {
        throw new BadRequestError('dataType must be one of dropdown, text, number');
      }
      payload.dataType = data.dataType;
    }
    if (data.isVariantDefining !== undefined) payload.isVariantDefining = !!data.isVariantDefining;
    if (data.isRequired !== undefined) payload.isRequired = !!data.isRequired;
    if (data.displayOrder !== undefined) payload.displayOrder = parseInt(data.displayOrder, 10) || 0;
    if (data.isActive !== undefined) payload.isActive = !!data.isActive;

    await attr.update(payload);

    // Replace dropdown options when explicitly provided
    if (data.options !== undefined) {
      if (attr.dataType !== 'dropdown') {
        throw new BadRequestError('Options can only be set on dropdown attributes');
      }
      const t = await sequelize.transaction();
      try {
        await ItemAttributeOption.destroy({ where: { attributeId: id }, transaction: t });
        const seen = new Set();
        let order = 0;
        for (const opt of data.options) {
          const value = typeof opt === 'string' ? opt.trim() : (opt && opt.value ? String(opt.value).trim() : '');
          if (!value) continue;
          if (seen.has(value.toLowerCase())) continue;
          seen.add(value.toLowerCase());
          await ItemAttributeOption.create({
            tenantId,
            attributeId: id,
            value,
            displayOrder: order++,
            isActive: true,
          }, { transaction: t });
        }
        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    logger.info(`Attribute updated: ${attr.code} by ${userId}`);
    return this.getById(id, tenantId);
  }

  async remove(id, tenantId) {
    const attr = await ItemAttribute.findOne({ where: { id, tenantId } });
    if (!attr) throw new NotFoundError('Attribute not found');

    // Soft-block removal if the attribute is referenced by variants.
    const { ItemVariantAttributeValue } = require('../models');
    const used = await ItemVariantAttributeValue.count({ where: { attributeId: id, tenantId } });
    if (used > 0) {
      throw new ConflictError('Attribute is in use by existing variants and cannot be deleted');
    }

    await attr.destroy();
    return true;
  }
}

module.exports = new ItemAttributeService();
