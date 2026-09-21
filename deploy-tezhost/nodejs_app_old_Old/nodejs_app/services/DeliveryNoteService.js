'use strict';

const deliveryNoteRepository = require('../repositories/DeliveryNoteRepository');
const { SalesOrder, SalesOrderDetail, DeliveryNote, DeliveryNoteDetail, sequelize } = require('../models');
const { deliveryNoteDTO, deliveryNoteListDTO } = require('../dto/DeliveryNoteDTO');
const { Op } = require('sequelize');
const Decimal = require('decimal.js');

class DeliveryNoteService {
  /**
   * List delivery notes with pagination
   */
  async list(query, tenantId) {
    const result = await deliveryNoteRepository.list({ ...query, tenantId });
    const { SalesInvoice } = require('../models');
    const { Op } = require('sequelize');

    // Get all delivery note IDs that have invoices
    const invoicedDNs = await SalesInvoice.findAll({
      where: {
        tenantId,
        deliveryNoteId: { [Op.ne]: null },
      },
      attributes: ['deliveryNoteId'],
    });
    const invoicedIds = new Set(invoicedDNs.map((i) => i.deliveryNoteId));

    return {
      ...result,
      items: result.items.map((dn) => ({
        ...deliveryNoteListDTO(dn),
        hasInvoice: invoicedIds.has(dn.id),
      })),
    };
  }

  /**
   * Get delivery note by ID
   */
  async getById(id, tenantId) {
    const dn = await deliveryNoteRepository.findById(id, tenantId);
    if (!dn) {
      const error = new Error('Delivery note not found');
      error.statusCode = 404;
      throw error;
    }
    return deliveryNoteDTO(dn);
  }

  /**
   * Generate delivery number
   */
  async generateNumber(tenantId) {
    return await deliveryNoteRepository.getNextSequence(tenantId);
  }

  /**
   * Create delivery note
   */
  async create(data, userId, tenantId) {
    const { salesOrderId, details, ...rest } = data;

    // Compute line totals
    const detailItems = details.map((d) => {
      const qty = new Decimal(d.quantity);
      const price = new Decimal(d.unitPrice);
      const taxPct = new Decimal(d.taxPercentage || 0);
      const discountPct = new Decimal(d.discountPercentage || 0);

      const lineTotal = qty.times(price);
      const discountAmount = lineTotal.times(discountPct.div(100));
      const afterDiscount = lineTotal.minus(discountAmount);
      const taxAmount = afterDiscount.times(taxPct.div(100));
      const finalTotal = afterDiscount.plus(taxAmount);

      return {
        ...d,
        totalAmount: parseFloat(finalTotal.toFixed(2)),
        tenantId,
      };
    });

    // Validate delivery quantities against sales order if applicable
    if (salesOrderId) {
      await this._validateDeliveryQuantities(salesOrderId, detailItems, tenantId);
    }

    // Generate delivery number
    const deliveryNumber = await this.generateNumber(tenantId);

    const deliveryNote = await deliveryNoteRepository.create({
      ...rest,
      salesOrderId: salesOrderId || null,
      deliveryNumber,
      status: 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
      details: detailItems,
    });

    return deliveryNoteDTO(deliveryNote);
  }

  /**
   * Generate delivery note from a sales order
   */
  async generateFromSalesOrder(data, userId, tenantId) {
    const { salesOrderId, warehouseId, deliveryDate, reference, notes, details } = data;

    // Verify sales order exists and is approved
    const salesOrder = await SalesOrder.findOne({
      where: { id: salesOrderId, tenantId },
      include: [{ model: SalesOrderDetail, as: 'details' }],
    });

    if (!salesOrder) {
      const error = new Error('Sales order not found');
      error.statusCode = 404;
      throw error;
    }

    if (salesOrder.status === 'draft' || salesOrder.status === 'closed') {
      const error = new Error(`Cannot generate delivery from sales order with status: ${salesOrder.status}`);
      error.statusCode = 400;
      throw error;
    }

    // Validate delivery quantities
    const detailItems = [];
    for (const d of details) {
      const soDetail = salesOrder.details.find((sd) => sd.id === d.salesOrderDetailId);
      if (!soDetail) {
        const error = new Error(`Sales order detail ID ${d.salesOrderDetailId} not found in this order`);
        error.statusCode = 400;
        throw error;
      }

      // Check already delivered qty
      const alreadyDelivered = await deliveryNoteRepository.getDeliveredQtyForOrderLine(d.salesOrderDetailId, tenantId);
      const orderedQty = parseFloat(soDetail.quantity);
      const remainingQty = orderedQty - alreadyDelivered;

      if (d.quantity > remainingQty) {
        const error = new Error(
          `Cannot deliver more than ordered. Item: ${d.itemId}, Ordered: ${orderedQty}, Already Delivered: ${alreadyDelivered}, Remaining: ${remainingQty}`
        );
        error.statusCode = 400;
        throw error;
      }

      const qty = new Decimal(d.quantity);
      const price = new Decimal(soDetail.unitPrice);
      const taxPct = new Decimal(soDetail.taxPercentage || 0);
      const discountPct = new Decimal(soDetail.discountPercentage || 0);

      const lineTotal = qty.times(price);
      const discountAmount = lineTotal.times(discountPct.div(100));
      const afterDiscount = lineTotal.minus(discountAmount);
      const taxAmount = afterDiscount.times(taxPct.div(100));
      const finalTotal = afterDiscount.plus(taxAmount);

      detailItems.push({
        salesOrderDetailId: d.salesOrderDetailId,
        itemId: d.itemId,
        description: soDetail.description || null,
        quantity: d.quantity,
        unitPrice: parseFloat(price.toFixed(4)),
        taxPercentage: parseFloat(taxPct.toFixed(2)),
        discountPercentage: parseFloat(discountPct.toFixed(2)),
        totalAmount: parseFloat(finalTotal.toFixed(2)),
        tenantId,
      });
    }

    const deliveryNumber = await this.generateNumber(tenantId);

    const deliveryNote = await deliveryNoteRepository.create({
      salesOrderId,
      customerId: salesOrder.customerId,
      warehouseId,
      deliveryDate,
      reference: reference || null,
      notes: notes || null,
      deliveryNumber,
      status: 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
      details: detailItems,
    });

    return deliveryNoteDTO(deliveryNote);
  }

  /**
   * Update delivery note
   */
  async update(id, data, userId, tenantId) {
    const existing = await deliveryNoteRepository.findById(id, tenantId);
    if (!existing) {
      const error = new Error('Delivery note not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'draft') {
      const error = new Error('Only draft delivery notes can be edited');
      error.statusCode = 400;
      throw error;
    }

    const { details, ...rest } = data;

    let detailItems;
    if (details) {
      detailItems = details.map((d) => {
        const qty = new Decimal(d.quantity);
        const price = new Decimal(d.unitPrice);
        const taxPct = new Decimal(d.taxPercentage || 0);
        const discountPct = new Decimal(d.discountPercentage || 0);

        const lineTotal = qty.times(price);
        const discountAmount = lineTotal.times(discountPct.div(100));
        const afterDiscount = lineTotal.minus(discountAmount);
        const taxAmount = afterDiscount.times(taxPct.div(100));
        const finalTotal = afterDiscount.plus(taxAmount);

        return {
          ...d,
          totalAmount: parseFloat(finalTotal.toFixed(2)),
          tenantId,
        };
      });
    }

    const updated = await deliveryNoteRepository.update(id, {
      ...rest,
      ...(detailItems !== undefined && { details: detailItems }),
      updatedBy: userId,
    }, tenantId);

    return deliveryNoteDTO(updated);
  }

  /**
   * Delete delivery note (only draft)
   */
  async delete(id, tenantId) {
    const existing = await deliveryNoteRepository.findById(id, tenantId);
    if (!existing) {
      const error = new Error('Delivery note not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'draft') {
      const error = new Error('Only draft delivery notes can be deleted');
      error.statusCode = 400;
      throw error;
    }

    await deliveryNoteRepository.delete(id, tenantId);
    return { message: 'Delivery note deleted successfully' };
  }

  /**
   * Update delivery note status
   */
  async updateStatus(id, status, userId, tenantId) {
    const dn = await deliveryNoteRepository.findById(id, tenantId);
    if (!dn) {
      const error = new Error('Delivery note not found');
      error.statusCode = 404;
      throw error;
    }

    // Start a transaction for inventory impact
    const transaction = await sequelize.transaction();

    try {
      if (status === 'delivered') {
        if (dn.status !== 'draft') {
          throw new Error(`Cannot mark as delivered from status: ${dn.status}`);
        }

        // Process inventory impact - reduce stock
        await deliveryNoteRepository.processInventoryImpact(dn, { transaction });

        await deliveryNoteRepository.update(id, {
          status: 'delivered',
          updatedBy: userId,
        }, tenantId, { transaction }); // Note: update in repo expects details but we're not changing them

        // Direct update for status only
        await DeliveryNote.update(
          { status: 'delivered', updatedBy: userId },
          { where: { id, tenantId }, transaction }
        );

      } else if (status === 'cancelled') {
        if (dn.status === 'cancelled') {
          throw new Error('Delivery note is already cancelled');
        }

        // If previously delivered, reverse inventory impact
        if (dn.status === 'delivered') {
          await deliveryNoteRepository.reverseInventoryImpact(dn, { transaction });
        }

        await DeliveryNote.update(
          { status: 'cancelled', updatedBy: userId },
          { where: { id, tenantId }, transaction }
        );
      } else {
        // Other status changes (e.g., back to draft)
        await DeliveryNote.update(
          { status, updatedBy: userId },
          { where: { id, tenantId }, transaction }
        );
      }

      await transaction.commit();

      // Update sales order status based on delivery progress
      if (dn.salesOrderId) {
        await this._updateSalesOrderDeliveryStatus(dn.salesOrderId, tenantId);
      }

      const updated = await deliveryNoteRepository.findById(id, tenantId);
      return deliveryNoteDTO(updated);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get deliveries for a sales order
   */
  async getBySalesOrder(salesOrderId, tenantId) {
    const deliveries = await deliveryNoteRepository.findBySalesOrderId(salesOrderId, tenantId);
    return deliveries.map((d) => ({
      id: d.id,
      deliveryNumber: d.deliveryNumber,
      deliveryDate: d.deliveryDate,
      status: d.status,
      totalAmount: parseFloat(d.totalAmount),
      warehouseName: d.warehouse ? d.warehouse.warehouseName : null,
      customerName: d.customer ? d.customer.customerName : null,
    }));
  }

  /**
   * Validate delivery quantities against sales order
   * Ensures cannot deliver more than ordered quantity
   */
  async _validateDeliveryQuantities(salesOrderId, details, tenantId) {
    const salesOrder = await SalesOrder.findOne({
      where: { id: salesOrderId, tenantId },
      include: [{ model: SalesOrderDetail, as: 'details' }],
    });

    if (!salesOrder) return; // Skip if no sales order linked

    for (const d of details) {
      if (!d.salesOrderDetailId) continue;

      const soDetail = salesOrder.details.find((sd) => sd.id === d.salesOrderDetailId);
      if (!soDetail) {
        const error = new Error(`Sales order detail ID ${d.salesOrderDetailId} not found`);
        error.statusCode = 400;
        throw error;
      }

      const alreadyDelivered = await deliveryNoteRepository.getDeliveredQtyForOrderLine(d.salesOrderDetailId, tenantId);
      const orderedQty = parseFloat(soDetail.quantity);
      const totalAfterThis = alreadyDelivered + d.quantity;

      if (totalAfterThis > orderedQty) {
        const error = new Error(
          `Cannot deliver more than ordered. Item: ${d.itemId}, Ordered: ${orderedQty}, Already Delivered: ${alreadyDelivered}, This Delivery: ${d.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }

  /**
   * Update sales order delivery status based on delivery progress
   */
  async _updateSalesOrderDeliveryStatus(salesOrderId, tenantId) {
    const so = await SalesOrder.findOne({
      where: { id: salesOrderId, tenantId },
      include: [{ model: SalesOrderDetail, as: 'details' }],
    });

    if (!so) return;

    // Sum delivered quantities across all non-cancelled deliveries
    let fullyDelivered = true;
    let partiallyDelivered = false;

    for (const detail of so.details) {
      const delivered = await deliveryNoteRepository.getDeliveredQtyForOrderLine(detail.id, tenantId);
      const ordered = parseFloat(detail.quantity);

      if (delivered > 0 && delivered < ordered) {
        partiallyDelivered = true;
        fullyDelivered = false;
      } else if (delivered <= 0) {
        fullyDelivered = false;
      }
    }

    let newStatus = so.status;
    if (fullyDelivered) {
      newStatus = 'delivered';
    } else if (partiallyDelivered) {
      newStatus = 'partially_delivered';
    }

    if (newStatus !== so.status) {
      await SalesOrder.update(
        { status: newStatus },
        { where: { id: salesOrderId, tenantId } }
      );
    }
  }
}

module.exports = new DeliveryNoteService();