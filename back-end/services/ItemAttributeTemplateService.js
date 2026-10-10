'use strict';
const {
  ItemAttributeTemplate,
  ItemAttributeTemplateAttribute,
  ItemAttribute,
  sequelize,
} = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * ItemAttributeTemplateService
 * Manages reusable attribute templates assigned to items/categories.
 */
class ItemAttributeTemplateService {
  async list(tenantId, query = {}) {
    const { page = 1, limit = 50, search } = query;
    const { Op } = require('sequelize');
    const where = { tenantId };
    if (search) where.name = { [Op.like]: `%${search}%` };

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await ItemAttributeTemplate.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      distinct: true,
      order: [['name', 'ASC']],
      include: [
        {
          model: ItemAttributeTemplateAttribute,
          as: 'templateAttributes',
          required: false,
          include: [{ model: ItemAttribute, as: 'attribute', required: false, include: [{ model: require('../models').ItemAttributeOption, as: 'options', required: false }] }],
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

  async getById(id, tenantId) {
    const tpl = await ItemAttributeTemplate.findOne({
      where: { id, tenantId },
      include: [
        {
          model: ItemAttributeTemplateAttribute,
          as: 'templateAttributes',
          required: false,
          include: [{ model: ItemAttribute, as: 'attribute', required: false, include: [{ model: require('../models').ItemAttributeOption, as: 'options', required: false }] }],
        },
      ],
    });
    if (!tpl) throw new NotFoundError('Attribute template not found');
    return tpl;
  }

  async create(data, tenantId, userId) {
    const name = (data.name || '').trim();
    if (!name) throw new BadRequestError('Template name is required');

    const t = await sequelize.transaction();
    try {
      const tpl = await ItemAttributeTemplate.create({
        tenantId,
        name,
        description: data.description || null,
        isActive: data.isActive !== undefined ? !!data.isActive : true,
        createdBy: userId,
        updatedBy: userId,
      }, { transaction: t });

      await this._syncAttributes(tpl.id, data.attributes, tenantId, t);
      await t.commit();
      return this.getById(tpl.id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async update(id, data, tenantId, userId) {
    const tpl = await ItemAttributeTemplate.findOne({ where: { id, tenantId } });
    if (!tpl) throw new NotFoundError('Attribute template not found');

    const payload = { updatedBy: userId };
    if (data.name !== undefined) payload.name = (data.name || '').trim();
    if (data.description !== undefined) payload.description = data.description;
    if (data.isActive !== undefined) payload.isActive = !!data.isActive;

    const t = await sequelize.transaction();
    try {
      await tpl.update(payload, { transaction: t });
      if (data.attributes !== undefined) {
        await this._syncAttributes(id, data.attributes, tenantId, t);
      }
      await t.commit();
      return this.getById(id, tenantId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async _syncAttributes(templateId, attributes, tenantId, transaction) {
    if (!Array.isArray(attributes)) return;

    await ItemAttributeTemplateAttribute.destroy({ where: { templateId }, transaction });

    const seen = new Set();
    let order = 0;
    for (const item of attributes) {
      const attributeId = typeof item === 'string' ? item : item.attributeId;
      if (!attributeId || seen.has(attributeId)) continue;
      seen.add(attributeId);

      const attr = await ItemAttribute.findOne({ where: { id: attributeId, tenantId }, transaction });
      if (!attr) {
        throw new BadRequestError(`Attribute ${attributeId} not found in your tenant`);
      }

      await ItemAttributeTemplateAttribute.create({
        tenantId,
        templateId,
        attributeId,
        isRequired: item.isRequired !== undefined ? !!item.isRequired : attr.isRequired,
        isVariantDefining: item.isVariantDefining !== undefined ? !!item.isVariantDefining : attr.isVariantDefining,
        displayOrder: item.displayOrder !== undefined ? parseInt(item.displayOrder, 10) || 0 : order,
      }, { transaction });
      order += 1;
    }
  }

  async remove(id, tenantId) {
    const tpl = await ItemAttributeTemplate.findOne({ where: { id, tenantId } });
    if (!tpl) throw new NotFoundError('Attribute template not found');

    const { Item } = require('../models');
    const used = await Item.count({ where: { attributeTemplateId: id, tenantId } });
    if (used > 0) {
      throw new BadRequestError('Template is assigned to items and cannot be deleted');
    }

    await tpl.destroy();
    return true;
  }
}

module.exports = new ItemAttributeTemplateService();
