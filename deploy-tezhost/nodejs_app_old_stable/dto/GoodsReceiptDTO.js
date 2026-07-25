'use strict';

class GoodsReceiptDetailDTO {
  constructor(data) {
    this.id = data.id || null;
    this.goodsReceiptId = data.goodsReceiptId || null;
    this.itemId = data.itemId || null;
    this.itemName = data.item ? (data.item.itemName || data.item.name) : (data.itemName || null);
    this.description = data.description || '';
    this.orderedQuantity = parseFloat(data.orderedQuantity || 0);
    this.receivedQuantity = parseFloat(data.receivedQuantity || 0);
    this.unitPrice = parseFloat(data.unitPrice || 0);
    this.taxPercentage = parseFloat(data.taxPercentage || 0);
    this.discountPercentage = parseFloat(data.discountPercentage || 0);
    this.lineTotal = parseFloat(data.lineTotal || 0);
  }
}

class GoodsReceiptDTO {
  constructor(data) {
    this.id = data.id || null;
    this.tenantId = data.tenantId || null;
    this.grnNumber = data.grnNumber || null;
    this.receiptDate = data.receiptDate || null;
    this.purchaseOrderId = data.purchaseOrderId || null;
    this.poNumber = data.purchaseOrder ? (data.purchaseOrder.poNumber || data.purchaseOrder.orderNumber) : (data.poNumber || null);
    this.supplierId = data.supplierId || null;
    this.supplierName = data.supplier ? (data.supplier.supplierName || data.supplier.name) : (data.supplierName || null);
    this.warehouseId = data.warehouseId || null;
    this.warehouseName = data.warehouse ? (data.warehouse.warehouseName || data.warehouse.name) : (data.warehouseName || null);
    this.reference = data.reference || '';
    this.notes = data.notes || '';
    this.status = data.status || 'draft';
    this.totalQuantity = parseFloat(data.totalQuantity || 0);
    this.createdBy = data.createdBy || null;
    this.details = (data.details || []).map((d) => new GoodsReceiptDetailDTO(d));
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

module.exports = { GoodsReceiptDTO, GoodsReceiptDetailDTO };