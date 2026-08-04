class QuotationDTO {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.quotationNumber = data.quotationNumber;
    this.customerId = data.customerId;
    this.quotationDate = data.quotationDate;
    this.expiryDate = data.expiryDate;
    this.warehouseId = data.warehouseId;
    this.reference = data.reference;
    this.subtotal = data.subtotal;
    this.taxAmount = data.taxAmount;
    this.discountAmount = data.discountAmount;
    this.totalAmount = data.totalAmount;
    this.notes = data.notes;
    this.termsConditions = data.termsConditions;
    this.status = data.status;
    this.convertedToType = data.convertedToType;
    this.convertedToId = data.convertedToId;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Associated data
    this.customer = data.Customer ? {
      id: data.Customer.id,
      code: data.Customer.code,
      name: data.Customer.name,
      contactPerson: data.Customer.contactPerson,
      phone: data.Customer.phone,
      mobile: data.Customer.mobile,
      email: data.Customer.email,
      trnVatNumber: data.Customer.trnVatNumber,
      billingAddress: data.Customer.billingAddress,
      shippingAddress: data.Customer.shippingAddress,
      creditLimit: data.Customer.creditLimit,
      paymentTerms: data.Customer.paymentTerms,
      status: data.Customer.status,
    } : null;

    this.warehouse = data.warehouse ? {
      id: data.warehouse.id,
      code: data.warehouse.code,
      name: data.warehouse.name,
    } : null;

    this.creator = data.creator ? {
      id: data.creator.id,
      username: data.creator.username,
      firstName: data.creator.firstName,
      lastName: data.creator.lastName,
    } : null;

    this.details = data.details ? data.details.map(d => ({
      id: d.id,
      quotationId: d.quotationId,
      itemId: d.itemId,
      description: d.description,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      taxPercentage: d.taxPercentage,
      discountPercentage: d.discountPercentage,
      taxAmount: d.taxAmount,
      discountAmount: d.discountAmount,
      lineTotal: d.lineTotal,
      sortOrder: d.sortOrder,
      item: d.item ? {
        id: d.item.id,
        itemCode: d.item.itemCode,
        name: d.item.name,
        unitOfMeasure: d.item.unitOfMeasure,
      } : null,
    })) : [];
  }

  static toList(quotations) {
    return quotations.map(q => new QuotationDTO(q));
  }

  static toDetail(data) {
    return new QuotationDTO(data);
  }
}

class QuotationDetailDTO {
  constructor(data) {
    this.id = data.id;
    this.quotationId = data.quotationId;
    this.itemId = data.itemId;
    this.description = data.description;
    this.quantity = data.quantity;
    this.unitPrice = data.unitPrice;
    this.taxPercentage = data.taxPercentage;
    this.discountPercentage = data.discountPercentage;
    this.taxAmount = data.taxAmount;
    this.discountAmount = data.discountAmount;
    this.lineTotal = data.lineTotal;
    this.sortOrder = data.sortOrder;
  }
}

module.exports = { QuotationDTO, QuotationDetailDTO };