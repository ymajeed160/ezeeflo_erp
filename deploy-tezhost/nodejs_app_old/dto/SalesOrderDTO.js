'use strict';

class SalesOrderDTO {
  static toDTO(order) {
    if (!order) return null;
    const plain = order.toJSON ? order.toJSON() : order;
    return {
      id: plain.id,
      orderNumber: plain.orderNumber,
      tenantId: plain.tenantId,
      customerId: plain.customerId,
      customer: plain.customer || null,
      quotationId: plain.quotationId,
      quotation: plain.quotation || null,
      warehouseId: plain.warehouseId,
      warehouse: plain.warehouse || null,
      orderDate: plain.orderDate,
      deliveryDate: plain.deliveryDate,
      reference: plain.reference,
      notes: plain.notes,
      termsConditions: plain.termsConditions,
      subtotalAmount: parseFloat(plain.subtotalAmount) || 0,
      discountAmount: parseFloat(plain.discountAmount) || 0,
      taxAmount: parseFloat(plain.taxAmount) || 0,
      totalAmount: parseFloat(plain.totalAmount) || 0,
      status: plain.status,
      approvedBy: plain.approvedBy,
      approvedAt: plain.approvedAt,
      details: plain.details ? plain.details.map((d) => SalesOrderDTO.detailToDTO(d)) : [],
      createdBy: plain.createdBy,
      updatedBy: plain.updatedBy,
      creator: plain.creator || null,
      updater: plain.updater || null,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  static detailToDTO(detail) {
    if (!detail) return null;
    const plain = detail.toJSON ? detail.toJSON() : detail;
    return {
      id: plain.id,
      salesOrderId: plain.salesOrderId,
      itemId: plain.itemId,
      item: plain.item || null,
      description: plain.description,
      quantity: parseFloat(plain.quantity) || 0,
      deliveredQuantity: parseFloat(plain.deliveredQuantity) || 0,
      unitPrice: parseFloat(plain.unitPrice) || 0,
      taxPercentage: parseFloat(plain.taxPercentage) || 0,
      discountPercentage: parseFloat(plain.discountPercentage) || 0,
      lineTotal: parseFloat(plain.lineTotal) || 0,
    };
  }

  static toListDTO(orders) {
    return orders.map((order) => SalesOrderDTO.toDTO(order));
  }

  static computeTotals(details) {
    let subtotal = 0, discountAmount = 0, taxAmount = 0;
    if (details && details.length) {
      details.forEach((line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        const taxPct = parseFloat(line.taxPercentage) || 0;
        const discPct = parseFloat(line.discountPercentage) || 0;
        const gross = qty * price;
        const disc = gross * (discPct / 100);
        const tax = (gross - disc) * (taxPct / 100);
        subtotal += gross;
        discountAmount += disc;
        taxAmount += tax;
        line.lineTotal = parseFloat((gross - disc + tax).toFixed(2));
      });
    }
    return {
      subtotalAmount: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat((subtotal - discountAmount + taxAmount).toFixed(2)),
    };
  }
}

module.exports = SalesOrderDTO;