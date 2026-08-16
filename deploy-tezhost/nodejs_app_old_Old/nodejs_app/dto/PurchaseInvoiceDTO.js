'use strict';

class PurchaseInvoiceDTO {
  static toDTO(invoice) {
    const data = invoice.toJSON ? invoice.toJSON() : invoice;
    return {
      id: data.id,
      tenantId: data.tenantId,
      invoiceNumber: data.invoiceNumber,
      supplierInvoiceNumber: data.supplierInvoiceNumber,
      supplierId: data.supplierId,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      warehouseId: data.warehouseId,
      status: data.status,
      notes: data.notes,
      subtotal: parseFloat(data.subtotal || 0),
      taxAmount: parseFloat(data.taxAmount || 0),
      discountAmount: parseFloat(data.discountAmount || 0),
      totalAmount: parseFloat(data.totalAmount || 0),
      journalEntryId: data.journalEntryId,
      supplier: data.supplier ? { id: data.supplier.id, name: data.supplier.name, code: data.supplier.code } : null,
      warehouse: data.warehouse ? { id: data.warehouse.id, name: data.warehouse.name } : null,
      details: (data.details || data.PurchaseInvoiceDetails || []).map((d) => ({
        id: d.id,
        itemId: d.itemId,
        description: d.description,
        quantity: parseFloat(d.quantity || 0),
        unitCost: parseFloat(d.unitCost || 0),
        taxPercent: parseFloat(d.taxPercent || 0),
        taxAmount: parseFloat(d.taxAmount || 0),
        discountPercent: parseFloat(d.discountPercent || 0),
        discountAmount: parseFloat(d.discountAmount || 0),
        lineTotal: parseFloat(d.lineTotal || 0),
        Item: d.Item ? { id: d.Item.id, itemName: d.Item.name, itemCode: d.Item.itemCode, itemType: d.Item.itemType } : null,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListDTO(invoices) {
    return invoices.map((inv) => this.toDTO(inv));
  }
}

module.exports = PurchaseInvoiceDTO;