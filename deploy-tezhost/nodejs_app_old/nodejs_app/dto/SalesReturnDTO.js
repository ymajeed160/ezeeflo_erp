'use strict';

/**
 * Sales Return DTO
 * Maps API payloads to model structures and vice versa
 */
class SalesReturnDTO {
  /**
   * Map request body to create sales return payload
   */
  static toCreate(body, tenantId, userId) {
    const details = (body.details || []).map((line) => ({
      itemId: line.itemId,
      salesInvoiceDetailId: line.salesInvoiceDetailId || null,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      returnReason: line.returnReason || null,
    }));

    const subTotal = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
    const discountTotal = details.reduce(
      (sum, d) => sum + (d.quantity * d.unitPrice * d.discountPercent / 100),
      0
    );
    const taxTotal = details.reduce((sum, d) => {
      const lineAmount = d.quantity * d.unitPrice * (1 - d.discountPercent / 100);
      return sum + (lineAmount * d.taxPercent / 100);
    }, 0);
    const grandTotal = subTotal - discountTotal + taxTotal;

    return {
      tenantId,
      returnNumber: body.returnNumber,
      customerId: body.customerId,
      salesInvoiceId: body.salesInvoiceId,
      warehouseId: body.warehouseId,
      customerAccountId: body.customerAccountId || null,
      revenueAccountId: body.revenueAccountId || null,
      taxAccountId: body.taxAccountId || null,
      returnDate: body.returnDate,
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
   * Map request body to update sales return payload
   */
  static toUpdate(body, userId) {
    const details = (body.details || []).map((line) => ({
      id: line.id || undefined,
      itemId: line.itemId,
      salesInvoiceDetailId: line.salesInvoiceDetailId || null,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      returnReason: line.returnReason || null,
    }));

    const subTotal = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
    const discountTotal = details.reduce(
      (sum, d) => sum + (d.quantity * d.unitPrice * d.discountPercent / 100),
      0
    );
    const taxTotal = details.reduce((sum, d) => {
      const lineAmount = d.quantity * d.unitPrice * (1 - d.discountPercent / 100);
      return sum + (lineAmount * d.taxPercent / 100);
    }, 0);
    const grandTotal = subTotal - discountTotal + taxTotal;

    return {
      customerId: body.customerId,
      salesInvoiceId: body.salesInvoiceId,
      warehouseId: body.warehouseId,
      customerAccountId: body.customerAccountId || null,
      revenueAccountId: body.revenueAccountId || null,
      taxAccountId: body.taxAccountId || null,
      returnDate: body.returnDate,
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
   * Map sales return model to list response (summary)
   */
  static toList(record) {
    return {
      id: record.id,
      returnNumber: record.returnNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      salesInvoiceId: record.salesInvoiceId,
      invoiceNumber: record.salesInvoice ? record.salesInvoice.invoiceNumber : '',
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      returnDate: record.returnDate,
      journalEntryId: record.journalEntryId || null,
      subTotal: parseFloat(record.subTotal || 0),
      taxTotal: parseFloat(record.taxTotal || 0),
      discountTotal: parseFloat(record.discountTotal || 0),
      grandTotal: parseFloat(record.grandTotal || 0),
      status: record.status,
      isInventoryImpact: record.isInventoryImpact,
      customerAccountId: record.customerAccountId || null,
      customerAccountName: record.customerAccount ? `${record.customerAccount.code} - ${record.customerAccount.name}` : '',
      revenueAccountId: record.revenueAccountId || null,
      revenueAccountName: record.revenueAccount ? `${record.revenueAccount.code} - ${record.revenueAccount.name}` : '',
      taxAccountId: record.taxAccountId || null,
      taxAccountName: record.taxAccount ? `${record.taxAccount.code} - ${record.taxAccount.name}` : '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Map sales return model to detail response (with lines)
   */
  static toDetail(record) {
    return {
      id: record.id,
      returnNumber: record.returnNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      salesInvoiceId: record.salesInvoiceId,
      invoiceNumber: record.salesInvoice ? record.salesInvoice.invoiceNumber : '',
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      returnDate: record.returnDate,
      journalEntryId: record.journalEntryId,
      reference: record.reference,
      notes: record.notes,
      subTotal: parseFloat(record.subTotal || 0),
      taxTotal: parseFloat(record.taxTotal || 0),
      discountTotal: parseFloat(record.discountTotal || 0),
      grandTotal: parseFloat(record.grandTotal || 0),
      status: record.status,
      isInventoryImpact: record.isInventoryImpact,
      customerAccountId: record.customerAccountId || null,
      customerAccount: record.customerAccount ? { id: record.customerAccount.id, code: record.customerAccount.code, name: record.customerAccount.name } : null,
      revenueAccountId: record.revenueAccountId || null,
      revenueAccount: record.revenueAccount ? { id: record.revenueAccount.id, code: record.revenueAccount.code, name: record.revenueAccount.name } : null,
      taxAccountId: record.taxAccountId || null,
      taxAccount: record.taxAccount ? { id: record.taxAccount.id, code: record.taxAccount.code, name: record.taxAccount.name } : null,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      details: (record.details || []).map((line) => ({
        id: line.id,
        itemId: line.itemId,
        itemName: line.item ? line.item.name : '',
        itemCode: line.item ? line.item.itemCode : '',
        salesInvoiceDetailId: line.salesInvoiceDetailId,
        description: line.description,
        quantity: parseFloat(line.quantity || 0),
        unitPrice: parseFloat(line.unitPrice || 0),
        taxPercent: parseFloat(line.taxPercent || 0),
        discountPercent: parseFloat(line.discountPercent || 0),
        lineTotal: parseFloat(line.lineTotal || 0),
        returnReason: line.returnReason,
      })),
    };
  }
}

module.exports = SalesReturnDTO;