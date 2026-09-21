'use strict';

/**
 * Credit Note DTO
 * Maps API payloads to model structures and vice versa
 */
class CreditNoteDTO {
  /**
   * Map request body to create credit note payload
   */
  static toCreate(body, tenantId, userId) {
    const details = (body.details || []).map((line) => ({
      itemId: line.itemId,
      salesReturnDetailId: line.salesReturnDetailId || null,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      costPrice: parseFloat(line.costPrice) || 0,
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
      creditNoteNumber: body.creditNoteNumber,
      customerId: body.customerId,
      salesReturnId: body.salesReturnId,
      salesInvoiceId: body.salesInvoiceId || null,
      warehouseId: body.warehouseId,
      creditNoteDate: body.creditNoteDate,
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
   * Map request body to update credit note payload
   */
  static toUpdate(body, userId) {
    const details = (body.details || []).map((line) => ({
      id: line.id || undefined,
      itemId: line.itemId,
      salesReturnDetailId: line.salesReturnDetailId || null,
      description: line.description || '',
      quantity: parseFloat(line.quantity) || 0,
      unitPrice: parseFloat(line.unitPrice) || 0,
      taxPercent: parseFloat(line.taxPercent) || 0,
      discountPercent: parseFloat(line.discountPercent) || 0,
      lineTotal: parseFloat(line.lineTotal) || 0,
      costPrice: parseFloat(line.costPrice) || 0,
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
      salesReturnId: body.salesReturnId,
      salesInvoiceId: body.salesInvoiceId || null,
      warehouseId: body.warehouseId,
      creditNoteDate: body.creditNoteDate,
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
   * Map credit note model to list response (summary)
   */
  static toList(record) {
    return {
      id: record.id,
      creditNoteNumber: record.creditNoteNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      salesReturnId: record.salesReturnId,
      returnNumber: record.salesReturn ? record.salesReturn.returnNumber : '',
      salesInvoiceId: record.salesInvoiceId,
      invoiceNumber: record.salesInvoice ? record.salesInvoice.invoiceNumber : '',
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      creditNoteDate: record.creditNoteDate,
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
   * Map credit note model to detail response (with lines)
   */
  static toDetail(record) {
    return {
      id: record.id,
      creditNoteNumber: record.creditNoteNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      salesReturnId: record.salesReturnId,
      returnNumber: record.salesReturn ? record.salesReturn.returnNumber : '',
      salesInvoiceId: record.salesInvoiceId,
      invoiceNumber: record.salesInvoice ? record.salesInvoice.invoiceNumber : '',
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse ? record.warehouse.name : '',
      creditNoteDate: record.creditNoteDate,
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
        salesReturnDetailId: line.salesReturnDetailId,
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

module.exports = CreditNoteDTO;