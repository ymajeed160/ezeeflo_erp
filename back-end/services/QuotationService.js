const quotationRepo = require('../repositories/QuotationRepository');
const { QuotationDTO, QuotationDetailDTO } = require('../dto/QuotationDTO');
const AuditLogService = require('./AuditLogService');

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

  async delete(tenantId, id, userId) {
    const rows = await quotationRepo.delete(tenantId, id);
    if (rows === 0) throw new Error('Quotation not found');
    await AuditLogService.log(tenantId, userId, 'Quotation', id, 'Deleted');
    return true;
  }

  async updateStatus(tenantId, id, status, userId) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');

    const validTransitions = {
      draft: ['sent'],
      sent: ['approved', 'rejected'],
      approved: ['converted'],
    };

    const currentStatus = quotation.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
    }

    await quotationRepo.updateStatus(tenantId, id, status, userId);
    await AuditLogService.log(tenantId, userId, 'Quotation', id, 'Status changed', { from: currentStatus, to: status });

    return await this.getById(tenantId, id);
  }

  async approve(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'approved', userId);
  }

  async reject(tenantId, id, userId) {
    return await this.updateStatus(tenantId, id, 'rejected', userId);
  }

  async convertToSalesOrder(tenantId, id, userId) {
    const quotation = await quotationRepo.findById(tenantId, id);
    if (!quotation) throw new Error('Quotation not found');
    if (quotation.status !== 'approved') {
      throw new Error('Only approved quotations can be converted to sales orders');
    }

    // Build sales order data from quotation
    const salesOrderService = require('./SalesOrderService');
    const soData = {
      customerId: quotation.customerId,
      quotationId: quotation.id,
      orderDate: new Date().toISOString().split('T')[0],
      reference: quotation.reference,
      notes: `Converted from Quotation ${quotation.quotationNumber}`,
      termsConditions: quotation.termsConditions,
      status: 'draft',
      details: quotation.details.map(d => ({
        itemId: d.itemId,
        description: d.description,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        taxPercentage: d.taxPercentage,
        discountPercentage: d.discountPercentage,
        lineTotal: d.lineTotal,
      })),
    };

    return await salesOrderService.create(tenantId, soData, userId);
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