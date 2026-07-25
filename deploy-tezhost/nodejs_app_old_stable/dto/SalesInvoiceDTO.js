'use strict';

/**
 * Sales Invoice DTO
 * Maps API payloads to model structures and vice versa
 */
class SalesInvoiceDTO {
  /**
   * Map request body to create invoice payload
   */
  static toCreate(body, tenantId, userId) {
    const details = (body.details || []).map((line) => ({
      itemId: line.itemId,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      costPrice: parseFloat(line.costPrice) || 0,
    }));

    // Compute header totals
    const subTotal = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
    const taxTotal = details.reduce((sum, d) => {
      const lineAmount = d.quantity * d.unitPrice * (1 - d.discountPercent / 100);
      return sum + (lineAmount * d.taxPercent / 100);
    }, 0);
    const discountTotal = details.reduce((sum, d) => {
      return sum + (d.quantity * d.unitPrice * d.discountPercent / 100);
    }, 0);
    const grandTotal = subTotal - discountTotal + taxTotal;

    return {
      tenantId,
      invoiceNumber: body.invoiceNumber,
      customerId: body.customerId,
      customerAccountId: body.customerAccountId || null,
      revenueAccountId: body.revenueAccountId || null,
      taxAccountId: body.taxAccountId || null,
      salesOrderId: body.salesOrderId || null,
      deliveryNoteId: body.deliveryNoteId || null,
      warehouseId: body.warehouseId,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      reference: body.reference || null,
      notes: body.notes || null,
      subTotal: parseFloat(subTotal.toFixed(2)),
      taxTotal: parseFloat(taxTotal.toFixed(2)),
      discountTotal: parseFloat(discountTotal.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      status: body.status || 'draft',
      isInventoryImpact: body.isInventoryImpact || false,
      createdBy: userId,
      updatedBy: userId,
      details,
    };
  }

  /**
   * Map request body to update invoice payload (status transitions handled separately)
   */
  static toUpdate(body, userId) {
    const details = (body.details || []).map((line) => ({
      id: line.id || undefined,
      itemId: line.itemId,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      costPrice: parseFloat(line.costPrice) || 0,
    }));

    const subTotal = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
    const taxTotal = details.reduce((sum, d) => {
      const lineAmount = d.quantity * d.unitPrice * (1 - d.discountPercent / 100);
      return sum + (lineAmount * d.taxPercent / 100);
    }, 0);
    const discountTotal = details.reduce((sum, d) => {
      return sum + (d.quantity * d.unitPrice * d.discountPercent / 100);
    }, 0);
    const grandTotal = subTotal - discountTotal + taxTotal;

    return {
      customerId: body.customerId,
      customerAccountId: body.customerAccountId || null,
      revenueAccountId: body.revenueAccountId || null,
      taxAccountId: body.taxAccountId || null,
      salesOrderId: body.salesOrderId || null,
      deliveryNoteId: body.deliveryNoteId || null,
      warehouseId: body.warehouseId,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      reference: body.reference || null,
      notes: body.notes || null,
      subTotal: parseFloat(subTotal.toFixed(2)),
      taxTotal: parseFloat(taxTotal.toFixed(2)),
      discountTotal: parseFloat(discountTotal.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      isInventoryImpact: body.isInventoryImpact || false,
      updatedBy: userId,
      details,
    };
  }

  /**
   * Map invoice model to allocation list (for payment allocation dropdown)
   * Includes outstanding balance calculation
   */
  static toAllocationList(record) {
    return {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      invoiceDate: record.invoiceDate,
      grandTotal: parseFloat(record.grandTotal || 0),
      outstandingBalance: parseFloat(record.outstandingBalance || 0),
      paidAmount: parseFloat(record.paidAmount || 0),
      customerId: record.customerId,
      status: record.status,
    };
  }

  /**
   * Map invoice model to list response (summary)
   */
  static toList(record) {
    return {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      customerAccountId: record.customerAccountId,
      customerAccountName: record.customerAccount ? `${record.customerAccount.code} - ${record.customerAccount.name}` : '',
      revenueAccountId: record.revenueAccountId,
      revenueAccountName: record.revenueAccount ? `${record.revenueAccount.code} - ${record.revenueAccount.name}` : '',
      taxAccountId: record.taxAccountId,
      taxAccountName: record.taxAccount ? `${record.taxAccount.code} - ${record.taxAccount.name}` : '',
      salesOrderId: record.salesOrderId,
      deliveryNoteId: record.deliveryNoteId,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      invoiceDate: record.invoiceDate,
      dueDate: record.dueDate,
      subTotal: parseFloat(record.subTotal || 0),
      taxTotal: parseFloat(record.taxTotal || 0),
      discountTotal: parseFloat(record.discountTotal || 0),
      grandTotal: parseFloat(record.grandTotal || 0),
      status: record.status,
      isInventoryImpact: record.isInventoryImpact,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Map invoice model to detail response (with lines)
   */
  static toDetail(record) {
    return {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      customerAccountId: record.customerAccountId,
      customerAccount: record.customerAccount ? { id: record.customerAccount.id, code: record.customerAccount.code, name: record.customerAccount.name } : null,
      revenueAccountId: record.revenueAccountId,
      revenueAccount: record.revenueAccount ? { id: record.revenueAccount.id, code: record.revenueAccount.code, name: record.revenueAccount.name } : null,
      taxAccountId: record.taxAccountId,
      taxAccount: record.taxAccount ? { id: record.taxAccount.id, code: record.taxAccount.code, name: record.taxAccount.name } : null,
      salesOrderId: record.salesOrderId,
      deliveryNoteId: record.deliveryNoteId,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      invoiceDate: record.invoiceDate,
      dueDate: record.dueDate,
      journalEntryId: record.journalEntryId,
      reference: record.reference,
      notes: record.notes,
      subTotal: parseFloat(record.subTotal || 0),
      taxTotal: parseFloat(record.taxTotal || 0),
      discountTotal: parseFloat(record.discountTotal || 0),
      grandTotal: parseFloat(record.grandTotal || 0),
      status: record.status,
      isInventoryImpact: record.isInventoryImpact,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      details: (record.details || []).map((line) => ({
        id: line.id,
        itemId: line.itemId,
        itemName: line.item ? line.item.name : '',
        itemCode: line.item ? line.item.itemCode : '',
        description: line.description,
        quantity: parseFloat(line.quantity || 0),
        unitPrice: parseFloat(line.unitPrice || 0),
        taxPercent: parseFloat(line.taxPercent || 0),
        discountPercent: parseFloat(line.discountPercent || 0),
        lineTotal: parseFloat(line.lineTotal || 0),
        costPrice: parseFloat(line.costPrice || 0),
      })),
    };
  }
}

module.exports = SalesInvoiceDTO;