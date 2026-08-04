'use strict';

/**
 * Delivery Note Detail DTO - transforms line item
 */
const deliveryNoteDetailDTO = (detail) => ({
  id: detail.id,
  deliveryNoteId: detail.deliveryNoteId,
  salesOrderDetailId: detail.salesOrderDetailId || null,
  itemId: detail.itemId,
  description: detail.description || null,
  quantity: parseFloat(detail.quantity) || 0,
  unitPrice: parseFloat(detail.unitPrice) || 0,
  taxPercentage: parseFloat(detail.taxPercentage) || 0,
  discountPercentage: parseFloat(detail.discountPercentage) || 0,
  totalAmount: parseFloat(detail.totalAmount) || 0,
  item: detail.item
    ? {
        id: detail.item.id,
        itemCode: detail.item.itemCode,
        itemName: detail.item.name,
        unitOfMeasure: detail.item.unitOfMeasure || null,
      }
    : null,
});

/**
 * Delivery Note DTO - full transformation of header + details
 */
const deliveryNoteDTO = (dn) => {
  if (!dn) return null;

  const dto = {
    id: dn.id,
    deliveryNumber: dn.deliveryNumber,
    salesOrderId: dn.salesOrderId || null,
    customerId: dn.customerId,
    warehouseId: dn.warehouseId,
    deliveryDate: dn.deliveryDate,
    reference: dn.reference || null,
    notes: dn.notes || null,
    status: dn.status,
    totalAmount: parseFloat(dn.totalAmount) || 0,
    tenantId: dn.tenantId,
    createdBy: dn.createdBy,
    updatedBy: dn.updatedBy,
    createdAt: dn.createdAt,
    updatedAt: dn.updatedAt,
    // Nested associations
    customer: dn.customer
      ? {
          id: dn.customer.id,
          customerCode: dn.customer.code,
          customerName: dn.customer.name,
        }
      : null,
    salesOrder: dn.salesOrder
      ? {
          id: dn.salesOrder.id,
          orderNumber: dn.salesOrder.orderNumber,
          status: dn.salesOrder.status,
        }
      : null,
    warehouse: dn.warehouse
      ? {
          id: dn.warehouse.id,
          warehouseCode: dn.warehouse.code,
          warehouseName: dn.warehouse.name,
        }
      : null,
    creator: dn.creator
      ? { id: dn.creator.id, username: dn.creator.username, fullName: dn.creator.fullName }
      : null,
    details: dn.details ? dn.details.map(deliveryNoteDetailDTO) : [],
  };

  return dto;
};

/**
 * Delivery Note List DTO - lighter for paginated responses (no details)
 */
const deliveryNoteListDTO = (dn) => ({
  id: dn.id,
  deliveryNumber: dn.deliveryNumber,
  salesOrderId: dn.salesOrderId || null,
  customerId: dn.customerId,
  customerName: dn.customer ? dn.customer.name : null,
  warehouseName: dn.warehouse ? dn.warehouse.name : null,
  deliveryDate: dn.deliveryDate,
  status: dn.status,
  totalAmount: parseFloat(dn.totalAmount) || 0,
  reference: dn.reference || null,
  salesOrderNumber: dn.salesOrder ? dn.salesOrder.orderNumber : null,
  createdBy: dn.createdBy,
  createdAt: dn.createdAt,
});

module.exports = { deliveryNoteDTO, deliveryNoteListDTO, deliveryNoteDetailDTO };