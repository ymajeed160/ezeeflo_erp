const quotationRepo = require('../repositories/QuotationRepository');
const { QuotationDTO, QuotationDetailDTO } = require('../dto/QuotationDTO');
const AuditLogService = require('./AuditLogService');
const { sequelize, Quotation } = require('../models');
const { requireDeletionEnabled } = require('../utils/deletionSettings');

class QuotationService {
  async list(tenantId, query) {
    const result = await quotationRepo.findAll(tenantId, query);
    return {
      data: QuotationDTO.toList(result.rows),
      total: result.count,
      page: result.page,
      limit: result.limit,
    };
  }

  async getById(tenantId, id) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) return null;
    return QuotationDTO.toDetail(quotation);
  }

  async create(tenantId, data, userId) {
    // Sanitize empty foreign key values to null
    if (data.warehouseId === '') data.warehouseId = null;

    this._validateLines(data.details);
    this._calculateTotals(data);

    const quotationNumber = await quotationRepo.getNextNumber(tenantId);
    data.quotationNumber = quotationNumber;

    const quotation = await quotationRepo.create(tenantId, data, userId);
    const result = await quotationRepo.findById(tenantId, quotation.id);

    await AuditLogService.log(tenantId, userId, 'Quotation', quotation.id, 'Created', data);

    return QuotationDTO.toDetail(result);
  }

  async update(tenantId, id, data, userId) {
    // Sanitize empty foreign key values to null
    if (data.warehouseId === '') data.warehouseId = null;

    this._validateLines(data.details);
    this._calculateTotals(data);

    const quotation = await quotationRepo.update(tenantId, id, data, userId);
    if (!quotation) throw new Error('Quotation not found');

    const result = await quotationRepo.findById(tenantId, id);

    await AuditLogService.log(tenantId, userId, 'Quotation', id, 'Updated', data);

    return QuotationDTO.toDetail(result);
  }

  async delete(tenantId, id, userId, reason = null) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');
    await requireDeletionEnabled(tenantId, 'quotations');
    if (quotation.status !== 'draft') throw new Error('Only draft quotations can be deleted');

    const t = await sequelize.transaction();
    try {
      await Quotation.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { id, tenantId }, transaction: t }
      );
      const rows = await quotationRepo.delete(tenantId, id, { transaction: t });
      if (rows === 0) throw new Error('Quotation not found');
      await AuditLogService.log(tenantId, userId, 'Quotation', id, 'SOFT_DELETE', { reason: reason || null });
      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async restore(tenantId, id, userId) {
    const quotation = await quotationRepo.findById(tenantId, id, true);
    if (!quotation) throw new Error('Quotation not found');
    if (!quotation.deletedAt) throw new Error('Quotation is not deleted');
    if (quotation.status !== 'draft') throw new Error('Only draft quotations can be restored');

    const t = await sequelize.transaction();
    try {
      await quotationRepo.restore(tenantId, id, { transaction: t });
      await AuditLogService.log(tenantId, userId, 'Quotation', id, 'RESTORE');
      await t.commit();
      return this.getById(tenantId, id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateStatus(tenantId, id, status, userId) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');

    const validTransitions = {
      draft: ['approved', 'rejected', 'cancelled'],
      sent: ['approved', 'rejected', 'cancelled'],
      approved: ['converted', 'partially_ordered', 'fully_ordered', 'cancelled'],
      partially_ordered: ['fully_ordered', 'cancelled'],
      rejected: ['draft'],
    };

    const currentStatus = quotation.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
    }

    await quotationRepo.updateStatus(tenantId, id, status, userId);
    await AuditLogService.log(tenantId, userId, 'Quotation', id, 'Status changed', { from: currentStatus, to: status });

    return await this.getById(tenantId, id);
  }

  /**
   * Confirm/approve a quotation internally. Independent from sending.
   */
  async confirm(tenantId, id, userId) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');

    if (quotation.status === 'cancelled') {
      throw new Error('This quotation cannot be confirmed because it has already been cancelled.');
    }
    if (['converted', 'fully_ordered'].includes(quotation.status)) {
      throw new Error('This quotation cannot be confirmed because it has already been fully ordered.');
    }
    if (!['draft', 'sent'].includes(quotation.status)) {
      throw new Error(`Quotation with status ${quotation.status} cannot be confirmed`);
    }

    await quotationRepo.confirm(tenantId, id, userId);
    await AuditLogService.log(tenantId, userId, 'Quotation', id, 'QUOTATION_CONFIRMED', {
      from: quotation.status,
      to: 'approved',
    });

    return await this.getById(tenantId, id);
  }

  async approve(tenantId, id, userId) {
    return await this.confirm(tenantId, id, userId);
  }

  async reject(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'rejected', userId);
  }

  async cancel(tenantId, id, userId, reason = null) {
    await this.updateStatus(tenantId, id, 'cancelled', userId);
    await Quotation.update(
      { cancelReason: reason || null },
      { where: { id, tenantId } }
    );
    return await this.getById(tenantId, id);
  }

  async convertToSalesOrder(tenantId, id, userId, data = {}) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');
    if (!['approved', 'partially_ordered'].includes(quotation.status)) {
      throw new Error('Only approved or partially ordered quotations can be converted to sales orders');
    }

    const requestedLines = data.details || data.lines || null;

    // Build the order lines (full remaining or requested partial quantities)
    const orderLines = [];
    for (const d of quotation.details) {
      const quotedQty = parseFloat(d.quantity);
      const orderedQty = parseFloat(d.orderedQuantity || 0);
      const available = quotedQty - orderedQty;

      let orderQty = available;
      if (requestedLines) {
        const req = requestedLines.find((l) => l.quotationDetailId === d.id);
        if (!req) continue; // not selected in this partial conversion
        orderQty = parseFloat(req.quantity || 0);
      }

      if (orderQty <= 0) continue;
      if (orderQty > available + 0.001) {
        throw new Error(
          `Order quantity for ${d.item ? d.item.name : d.itemId} exceeds remaining quotation quantity. Available: ${available}`
        );
      }

      orderLines.push({
        quotationDetailId: d.id,
        itemId: d.itemId,
        description: d.description,
        quantity: orderQty,
        unitPrice: d.unitPrice,
        taxPercentage: d.taxPercentage || 0,
        discountPercentage: d.discountPercentage || 0,
      });
    }

    if (orderLines.length === 0) {
      throw new Error('No remaining quantity available to convert');
    }

    const salesOrderService = require('./SalesOrderService');
    const soData = {
      customerId: quotation.customerId,
      quotationId: quotation.id,
      warehouseId: quotation.warehouseId || null,
      orderDate: new Date().toISOString().split('T')[0],
      reference: quotation.reference,
      notes: `Converted from Quotation ${quotation.quotationNumber}`,
      termsConditions: quotation.termsConditions,
      status: 'draft',
      details: orderLines,
    };

    return await salesOrderService.create(tenantId, soData, userId);
  }

  async getConvertibleLines(tenantId, id) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');

    return {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      warehouseId: quotation.warehouseId,
      status: quotation.status,
      lines: quotation.details.map((d) => {
        const quotedQty = parseFloat(d.quantity);
        const orderedQty = parseFloat(d.orderedQuantity || 0);
        return {
          quotationDetailId: d.id,
          itemId: d.itemId,
          itemName: d.item ? (d.item.name || d.item.itemName || '') : '',
          description: d.description,
          quotedQuantity: quotedQty,
          orderedQuantity: orderedQty,
          availableQuantity: Math.max(0, quotedQty - orderedQty),
          unitPrice: parseFloat(d.unitPrice),
          taxPercentage: parseFloat(d.taxPercentage || 0),
          discountPercentage: parseFloat(d.discountPercentage || 0),
        };
      }),
    };
  }

  _validateLines(details) {
    if (!details || details.length === 0) {
      throw new Error('At least one line item is required');
    }
    for (const line of details) {
      if (!line.itemId) throw new Error('Item is required for each line');
      if (!line.quantity || parseFloat(line.quantity) <= 0) throw new Error('Quantity must be greater than 0');
      if (!line.unitPrice || parseFloat(line.unitPrice) < 0) throw new Error('Unit price cannot be negative');
    }
  }

  _calculateTotals(data) {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (const line of data.details) {
      const qty = parseFloat(line.quantity);
      const price = parseFloat(line.unitPrice);
      const taxPct = parseFloat(line.taxPercentage || 0);
      const discountPct = parseFloat(line.discountPercentage || 0);

      const lineTotal = qty * price;
      const lineDiscount = lineTotal * (discountPct / 100);
      const taxableAmount = lineTotal - lineDiscount;
      const lineTax = taxableAmount * (taxPct / 100);

      line.lineTotal = parseFloat((lineTotal).toFixed(2));
      line.taxAmount = parseFloat((lineTax).toFixed(2));
      line.discountAmount = parseFloat((lineDiscount).toFixed(2));

      subtotal += lineTotal;
      totalTax += lineTax;
      totalDiscount += lineDiscount;
    }

    data.subtotal = parseFloat(subtotal.toFixed(2));
    data.taxAmount = parseFloat(totalTax.toFixed(2));
    data.discountAmount = parseFloat(totalDiscount.toFixed(2));
    data.totalAmount = parseFloat((subtotal + totalTax - totalDiscount).toFixed(2));
  }
}

module.exports = new QuotationService();