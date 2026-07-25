'use strict';

class PurchaseReturnDetailDTO {
  constructor(data) {
    this.id = data.id || null;
    this.purchaseReturnId = data.purchaseReturnId || null;
    this.itemId = data.itemId || null;
    this.itemName = data.itemName || data.item?.name || null;
    this.itemCode = data.itemCode || data.item?.code || null;
    this.itemType = data.itemType || data.item?.type || null;
    this.description = data.description || null;
    this.quantity = parseFloat(data.quantity) || 0;
    this.unitCost = parseFloat(data.unitCost) || 0;
    this.taxRate = parseFloat(data.taxRate) || 0;
    this.discountAmount = parseFloat(data.discountAmount) || 0;
    this.lineTotal = parseFloat(data.lineTotal) || 0;
    this.warehouseId = data.warehouseId || null;
    this.warehouseName = data.warehouseName || data.warehouse?.name || null;

    // Computed
    const subtotal = this.quantity * this.unitCost;
    this.subtotal = parseFloat(subtotal.toFixed(2));
    this.taxAmount = parseFloat(((subtotal - this.discountAmount) * (this.taxRate / 100)).toFixed(2));
    this.total = parseFloat((subtotal - this.discountAmount + this.taxAmount).toFixed(2));
  }

  static toDTO(data) {
    return new PurchaseReturnDetailDTO(data);
  }

  static toDTOList(list) {
    if (!list) return [];
    return list.map(item => new PurchaseReturnDetailDTO(item));
  }
}

class PurchaseReturnDTO {
  constructor(data) {
    this.id = data.id || null;
    this.tenantId = data.tenantId || null;
    this.returnNumber = data.returnNumber || null;
    this.returnDate = data.returnDate || null;
    this.supplierId = data.supplierId || null;
    this.supplierName = data.supplierName || data.supplier?.name || null;
    this.purchaseInvoiceId = data.purchaseInvoiceId || null;
    this.purchaseInvoiceNumber = data.purchaseInvoiceNumber || data.purchaseInvoice?.invoiceNumber || null;
    this.goodsReceiptId = data.goodsReceiptId || null;
    this.goodsReceiptNumber = data.goodsReceiptNumber || data.goodsReceipt?.receiptNumber || null;
    this.warehouseId = data.warehouseId || null;
    this.warehouseName = data.warehouseName || data.warehouse?.name || null;
    this.referenceType = data.referenceType || null;
    this.status = data.status || 'Draft';
    this.totalAmount = parseFloat(data.totalAmount) || 0;
    this.notes = data.notes || null;
    this.details = data.details ? PurchaseReturnDetailDTO.toDTOList(data.details) : [];
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static toDTO(data) {
    return new PurchaseReturnDTO(data);
  }

  static toDTOList(list) {
    if (!list) return [];
    return list.map(item => new PurchaseReturnDTO(item));
  }

  static toSummary(data) {
    return {
      id: data.id,
      returnNumber: data.returnNumber,
      returnDate: data.returnDate,
      supplierId: data.supplierId,
      supplierName: data.supplier?.name || data.supplierName || null,
      purchaseInvoiceId: data.purchaseInvoiceId,
      purchaseInvoiceNumber: data.purchaseInvoice?.invoiceNumber || data.purchaseInvoiceNumber || null,
      goodsReceiptNumber: data.goodsReceipt?.receiptNumber || data.goodsReceiptNumber || null,
      referenceType: data.referenceType,
      warehouseName: data.warehouse?.name || data.warehouseName || null,
      status: data.status,
      totalAmount: parseFloat(data.totalAmount) || 0,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  static toSummaryList(list) {
    if (!list) return [];
    return list.map(item => PurchaseReturnDTO.toSummary(item));
  }
}

module.exports = { PurchaseReturnDTO, PurchaseReturnDetailDTO };