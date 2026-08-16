const { PurchaseRequest, PurchaseRequestDetail, User, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

class PurchaseRequestRepository {
  async findAll(tenantId, filters = {}) {
    const { search, status, fromDate, toDate, page = 1, limit = 20, sortBy = 'requestDate', sortOrder = 'DESC' } = filters;
    const where = { tenantId };
    if (status) where.status = status;
    if (fromDate && toDate) {
      where.requestDate = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.requestDate = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.requestDate = { [Op.lte]: toDate };
    }
    if (search) {
      where[Op.or] = [
        { requestNumber: { [Op.like]: `%${search}%` } },
        { requestedBy: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'requestor', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });
    return { rows, count, page: parseInt(page), limit: parseInt(limit) };
  }

  async findById(tenantId, id) {
    return await PurchaseRequest.findOne({
      where: { id, tenantId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'requestor', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: PurchaseRequestDetail,
          as: 'details',
          include: [{ model: Item, as: 'item', attributes: ['id', 'itemCode', 'name', 'unitOfMeasure', 'itemType', 'isInventoryTracked'] }],
        },
      ],
      order: [[{ model: PurchaseRequestDetail, as: 'details' }, 'sortOrder', 'ASC']],
    });
  }

  async findByNumber(tenantId, requestNumber) {
    return await PurchaseRequest.findOne({ where: { tenantId, requestNumber } });
  }

  async getNextNumber(tenantId) {
    const year = new Date().getFullYear();
    const pattern = `PR-${year}-%`;
    // Use raw SQL with MAX() for reliable numeric ordering across all records
    const [result] = await sequelize.query(
      `SELECT MAX(request_number) AS maxNumber FROM purchase_requests WHERE tenant_id = ? AND request_number LIKE ?`,
      { replacements: [tenantId, pattern], type: sequelize.QueryTypes.SELECT }
    );
    if (!result || !result.maxNumber) return `PR-${year}-00001`;
    const parts = result.maxNumber.split('-');
    const num = parseInt(parts[2], 10) + 1;
    return `PR-${year}-${String(num).padStart(5, '0')}`;
  }

  async create(tenantId, data, userId) {
    const t = await sequelize.transaction();
    try {
      const request = await PurchaseRequest.create({
        tenantId,
        requestNumber: data.requestNumber,
        requestDate: data.requestDate,
        requestedBy: data.requestedBy,
        department: data.department,
        notes: data.notes,
        status: 'draft',
        createdBy: userId,
      }, { transaction: t });

      if (data.details && data.details.length > 0) {
        const details = data.details.map((d, i) => ({
          tenantId,
          purchaseRequestId: request.id,
          itemId: d.itemId,
          description: d.description,
          quantity: d.quantity,
          requiredDate: d.requiredDate,
          sortOrder: d.sortOrder !== undefined ? d.sortOrder : i,
        }));
        await PurchaseRequestDetail.bulkCreate(details, { transaction: t });
      }

      await t.commit();
      return request;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async update(tenantId, id, data, userId) {
    const t = await sequelize.transaction();
    try {
      const request = await PurchaseRequest.findOne({ where: { id, tenantId } });
      if (!request) { await t.rollback(); return null; }

      await request.update({
        requestDate: data.requestDate !== undefined ? data.requestDate : request.requestDate,
        requestedBy: data.requestedBy !== undefined ? data.requestedBy : request.requestedBy,
        department: data.department !== undefined ? data.department : request.department,
        notes: data.notes !== undefined ? data.notes : request.notes,
        updatedBy: userId,
      }, { transaction: t });

      if (data.details !== undefined) {
        await PurchaseRequestDetail.destroy({ where: { purchaseRequestId: id }, transaction: t });
        const details = data.details.map((d, i) => ({
          tenantId,
          purchaseRequestId: id,
          itemId: d.itemId,
          description: d.description,
          quantity: d.quantity,
          requiredDate: d.requiredDate,
          sortOrder: d.sortOrder !== undefined ? d.sortOrder : i,
        }));
        await PurchaseRequestDetail.bulkCreate(details, { transaction: t });
      }

      await t.commit();
      return request;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async delete(tenantId, id) {
    return await PurchaseRequest.destroy({ where: { id, tenantId } });
  }

  async updateStatus(tenantId, id, status, userId) {
    return await PurchaseRequest.update(
      { status, updatedBy: userId },
      { where: { id, tenantId } },
    );
  }
}

module.exports = new PurchaseRequestRepository();