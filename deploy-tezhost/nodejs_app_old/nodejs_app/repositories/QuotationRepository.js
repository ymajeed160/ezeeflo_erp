const { Quotation, QuotationDetail, Customer, Warehouse, User, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

class QuotationRepository {
  async findAll(tenantId, filters = {}) {
    const { search, status, customerId, fromDate, toDate, page = 1, limit = 20, sortBy = 'quotationDate', sortOrder = 'DESC' } = filters;
    const where = { tenantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (fromDate && toDate) {
      where.quotationDate = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.quotationDate = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.quotationDate = { [Op.lte]: toDate };
    }
    if (search) {
      where[Op.or] = [
        { quotationNumber: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await Quotation.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'code', 'name', 'contactPerson', 'phone', 'mobile', 'email', 'vatNumber'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });
    return { rows, count, page: parseInt(page), limit: parseInt(limit) };
  }

  async findById(tenantId, id) {
    return await Quotation.findOne({
      where: { id, tenantId },
      include: [
        { model: Customer },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: QuotationDetail,
          as: 'details',
          include: [{ model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'unitOfMeasure'] }],
        },
      ],
    });
  }

  async findByNumber(tenantId, quotationNumber) {
    return await Quotation.findOne({ where: { tenantId, quotationNumber } });
  }

  async create(tenantId, data, userId) {
    const t = await sequelize.transaction();
    try {
      const quotation = await Quotation.create({
        tenantId,
        quotationNumber: data.quotationNumber,
        customerId: data.customerId,
        quotationDate: data.quotationDate,
        expiryDate: data.expiryDate,
        warehouseId: data.warehouseId,
        reference: data.reference,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        totalAmount: data.totalAmount,
        notes: data.notes,
        termsConditions: data.termsConditions,
        status: data.status || 'draft',
        createdBy: userId,
        updatedBy: userId,
      }, { transaction: t });

      if (data.details && data.details.length > 0) {
        const details = data.details.map((d, i) => ({
          tenantId,
          quotationId: quotation.id,
          itemId: d.itemId,
          description: d.description,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          taxPercentage: d.taxPercentage || 0,
          discountPercentage: d.discountPercentage || 0,
          taxAmount: d.taxAmount || 0,
          discountAmount: d.discountAmount || 0,
          lineTotal: d.lineTotal,
          sortOrder: d.sortOrder !== undefined ? d.sortOrder : i,
        }));
        await QuotationDetail.bulkCreate(details, { transaction: t });
      }
      await t.commit();
      return quotation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async update(tenantId, id, data, userId) {
    const t = await sequelize.transaction();
    try {
      const quotation = await Quotation.findOne({ where: { id, tenantId }, transaction: t });
      if (!quotation) {
        await t.rollback();
        return null;
      }
      await quotation.update({
        customerId: data.customerId,
        quotationDate: data.quotationDate,
        expiryDate: data.expiryDate,
        warehouseId: data.warehouseId,
        reference: data.reference,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        totalAmount: data.totalAmount,
        notes: data.notes,
        termsConditions: data.termsConditions,
        status: data.status,
        updatedBy: userId,
      }, { transaction: t });

      if (data.details) {
        await QuotationDetail.destroy({ where: { quotationId: id }, transaction: t });
        const details = data.details.map((d, i) => ({
          tenantId,
          quotationId: id,
          itemId: d.itemId,
          description: d.description,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          taxPercentage: d.taxPercentage || 0,
          discountPercentage: d.discountPercentage || 0,
          taxAmount: d.taxAmount || 0,
          discountAmount: d.discountAmount || 0,
          lineTotal: d.lineTotal,
          sortOrder: d.sortOrder !== undefined ? d.sortOrder : i,
        }));
        await QuotationDetail.bulkCreate(details, { transaction: t });
      }
      await t.commit();
      return quotation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async delete(tenantId, id) {
    return await Quotation.destroy({ where: { id, tenantId } });
  }

  async updateStatus(tenantId, id, status, userId) {
    return await Quotation.update({ status, updatedBy: userId }, { where: { id, tenantId } });
  }

  async convert(tenantId, id, convertedToType, convertedToId, userId, options = {}) {
    return await Quotation.update(
      { status: 'converted', convertedToType, convertedToId, updatedBy: userId },
      { where: { id, tenantId }, transaction: options.transaction }
    );
  }

  async getNextNumber(tenantId) {
    const year = new Date().getFullYear();
    const last = await Quotation.findOne({
      where: {
        tenantId,
        quotationNumber: { [Op.like]: `QUO-${year}-%` },
      },
      order: [['quotationNumber', 'DESC']],
    });
    if (!last) return `QUO-${year}-00001`;
    const parts = last.quotationNumber.split('-');
    const num = parseInt(parts[2]) + 1;
    return `QUO-${year}-${String(num).padStart(5, '0')}`;
  }
}

module.exports = new QuotationRepository();