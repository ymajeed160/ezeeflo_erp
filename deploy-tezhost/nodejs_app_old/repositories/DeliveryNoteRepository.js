'use strict';

const { DeliveryNote, DeliveryNoteDetail, Customer, SalesOrder, SalesOrderDetail, Warehouse, User, Item, Tenant, InventoryBalance, InventoryTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');

class DeliveryNoteRepository {
  /**
   * List delivery notes with pagination, sorting, filtering, and search
   */
  async list({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', search = '', status = '', tenantId }) {
    const offset = (page - 1) * limit;
    const where = { tenantId };

    if (status) {
      where.status = status;
    }

    // Search across deliveryNumber, reference, notes, and customer name
    let customerWhere = {};
    if (search) {
      where[Op.or] = [
        { deliveryNumber: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
      customerWhere = { customerName: { [Op.like]: `%${search}%` } };
    }

    const { count, rows } = await DeliveryNote.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      include: [
        { model: Customer, as: 'customer', where: Object.keys(customerWhere).length ? customerWhere : undefined, required: !!search },
        { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'orderNumber', 'status'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      distinct: true,
    });

    return {
      items: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find delivery note by ID with all details
   */
  async findById(id, tenantId) {
    return await DeliveryNote.findOne({
      where: { id, tenantId },
      include: [
        { model: Customer, as: 'customer', required: false },
        { model: SalesOrder, as: 'salesOrder', required: false },
        { model: Warehouse, as: 'warehouse', required: false },
        {
          model: DeliveryNoteDetail,
          as: 'details',
          required: false,
          include: [
            {
              model: Item,
              as: 'item',
              required: false,
              attributes: ['id', 'itemCode', 'name', 'unitOfMeasure'],
            },
            { model: SalesOrderDetail, as: 'salesOrderDetail', required: false },
          ],
        },
        { model: User, as: 'creator', required: false, attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'updater', required: false, attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });
  }

  /**
   * Find by delivery number
   */
  async findByNumber(deliveryNumber, tenantId) {
    return await DeliveryNote.findOne({
      where: { deliveryNumber, tenantId },
      include: [{ model: DeliveryNoteDetail, as: 'details' }],
    });
  }

  /**
   * Create delivery note with details
   */
  async create(data, { transaction } = {}) {
    const { details, ...headerData } = data;

    const deliveryNote = await DeliveryNote.create(headerData, { transaction });

    if (details && details.length > 0) {
      const detailRecords = details.map((d) => ({
        ...d,
        deliveryNoteId: deliveryNote.id,
        tenantId: headerData.tenantId,
      }));
      await DeliveryNoteDetail.bulkCreate(detailRecords, { transaction });

      // Recalculate total from details
      const total = await DeliveryNoteDetail.sum('totalAmount', {
        where: { deliveryNoteId: deliveryNote.id, tenantId: headerData.tenantId },
        transaction,
      });
      await DeliveryNote.update({ totalAmount: total || 0 }, {
        where: { id: deliveryNote.id, tenantId: headerData.tenantId },
        transaction,
      });
    }

    return await this.findById(deliveryNote.id, headerData.tenantId);
  }

  /**
   * Update delivery note (header + replace details)
   */
  async update(id, data, tenantId, { transaction } = {}) {
    const { details, ...headerData } = data;

    await DeliveryNote.update(headerData, {
      where: { id, tenantId },
      transaction,
    });

    if (details !== undefined) {
      // Delete existing details
      await DeliveryNoteDetail.destroy({
        where: { deliveryNoteId: id, tenantId },
        transaction,
      });

      // Insert new details
      if (details.length > 0) {
        const detailRecords = details.map((d) => ({
          ...d,
          deliveryNoteId: id,
          tenantId,
        }));
        await DeliveryNoteDetail.bulkCreate(detailRecords, { transaction });
      }
    }

    // Recalculate total
    const total = await DeliveryNoteDetail.sum('totalAmount', {
      where: { deliveryNoteId: id, tenantId },
      transaction,
    });

    await DeliveryNote.update({ totalAmount: total || 0 }, {
      where: { id, tenantId },
      transaction,
    });

    return await this.findById(id, tenantId);
  }

  /**
   * Delete delivery note (soft delete)
   */
  async delete(id, tenantId) {
    const deliveryNote = await DeliveryNote.findOne({ where: { id, tenantId } });
    if (!deliveryNote) return null;
    await deliveryNote.destroy();
    return deliveryNote;
  }

  /**
   * Get next delivery number sequence
   */
  async getNextSequence(tenantId) {
    const maxRecord = await DeliveryNote.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });

    const year = new Date().getFullYear();
    let nextNumber = 1;

    if (maxRecord && maxRecord.deliveryNumber) {
      const parts = maxRecord.deliveryNumber.split('-');
      if (parts.length === 3 && parts[0] === 'DN' && parts[1] === year.toString()) {
        nextNumber = parseInt(parts[2]) + 1;
      }
    }

    return `DN-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Get total delivered quantity for a sales order detail line
   * Used for validation: cannot deliver more than ordered
   */
  async getDeliveredQtyForOrderLine(salesOrderDetailId, tenantId) {
    const result = await DeliveryNoteDetail.sum('quantity', {
      where: { salesOrderDetailId, tenantId },
      include: [
        {
          model: DeliveryNote,
          as: 'deliveryNote',
          where: { status: { [Op.ne]: 'cancelled' } },
          required: true,
        },
      ],
    });
    return parseFloat(result) || 0;
  }

  /**
   * Get all deliveries for a sales order
   */
  async findBySalesOrderId(salesOrderId, tenantId) {
    return await DeliveryNote.findAll({
      where: { salesOrderId, tenantId },
      include: [
        { model: Customer, as: 'customer' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Process inventory reduction for delivery (when status changes to delivered)
   * Uses weighted average cost for COGS
   */
  async processInventoryImpact(deliveryNote, { transaction } = {}) {
    const { id, warehouseId, tenantId, details } = deliveryNote;

    // Skip inventory processing for service-only items (no warehouse)
    if (!warehouseId) return;

    for (const detail of details) {
      const itemId = detail.itemId;
      const quantity = parseFloat(detail.quantity);

      // Get current inventory balance
      const balance = await InventoryBalance.findOne({
        where: { itemId, warehouseId, tenantId },
        transaction,
      });

      if (!balance || parseFloat(balance.quantity) < quantity) {
        throw new Error(`Insufficient stock for item ID ${itemId}. Available: ${balance ? parseFloat(balance.quantity) : 0}, Required: ${quantity}`);
      }

      // Calculate weighted average cost
      const currentQty = parseFloat(balance.quantity);
      const currentValue = parseFloat(balance.totalValue);
      const avgCost = currentQty > 0 ? currentValue / currentQty : 0;

      // Reduce inventory
      const newQty = currentQty - quantity;
      const newValue = parseFloat((newQty * avgCost).toFixed(2));

      await InventoryBalance.update(
        { quantity: newQty, totalValue: newValue },
        { where: { id: balance.id }, transaction }
      );

      // Create inventory transaction (OUT)
      await InventoryTransaction.create({
        itemId,
        warehouseId,
        transactionType: 'out',
        referenceType: 'delivery_note',
        referenceId: id,
        quantity: -quantity,
        unitCost: avgCost,
        totalCost: parseFloat((quantity * avgCost).toFixed(2)),
        balanceAfter: newQty,
        description: `Delivery Note: ${deliveryNote.deliveryNumber}`,
        tenantId,
      }, { transaction });
    }
  }

  /**
   * Reverse inventory impact (for cancelled delivery notes)
   */
  async reverseInventoryImpact(deliveryNote, { transaction } = {}) {
    const { id, warehouseId, tenantId, details } = deliveryNote;

    // Skip inventory processing for service-only items (no warehouse)
    if (!warehouseId) return;

    for (const detail of details) {
      const itemId = detail.itemId;
      const quantity = parseFloat(detail.quantity);

      const balance = await InventoryBalance.findOne({
        where: { itemId, warehouseId, tenantId },
        transaction,
      });

      const currentQty = balance ? parseFloat(balance.quantity) : 0;
      const currentValue = balance ? parseFloat(balance.totalValue) : 0;
      const avgCost = currentQty > 0 ? currentValue / currentQty : 0;

      const newQty = currentQty + quantity;
      const newValue = parseFloat((currentValue + quantity * avgCost).toFixed(2));

      if (balance) {
        await InventoryBalance.update(
          { quantity: newQty, totalValue: newValue },
          { where: { id: balance.id }, transaction }
        );
      }

      // Create inventory transaction (IN - reversal)
      await InventoryTransaction.create({
        itemId,
        warehouseId,
        transactionType: 'in',
        referenceType: 'delivery_note_cancel',
        referenceId: id,
        quantity,
        unitCost: avgCost,
        totalCost: parseFloat((quantity * avgCost).toFixed(2)),
        balanceAfter: newQty,
        description: `Cancelled Delivery Note: ${deliveryNote.deliveryNumber}`,
        tenantId,
      }, { transaction });
    }
  }
}

module.exports = new DeliveryNoteRepository();