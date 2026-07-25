'use strict';

/**
 * Customer Payment DTO
 * Maps API payloads to model structures and vice versa
 */
class CustomerPaymentDTO {
  /**
   * Map request body to create customer payment payload
   */
  static toCreate(body, tenantId, userId) {
    const allocations = (body.allocations || []).map((alloc) => ({
      salesInvoiceId: alloc.salesInvoiceId,
      allocatedAmount: parseFloat(alloc.allocatedAmount) || 0,
    }));

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    return {
      tenantId,
      paymentNumber: body.paymentNumber,
      customerId: body.customerId,
      paymentDate: body.paymentDate,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      amount: parseFloat(body.amount || totalAllocated || 0),
      reference: body.reference || null,
      bankAccountId: body.bankAccountId || null,
      paymentAccountId: body.paymentAccountId || null,
      customerAccountId: body.customerAccountId || null,
      notes: body.notes || null,
      status: body.status || 'draft',
      createdBy: userId,
      updatedBy: userId,
      allocations,
    };
  }

  /**
   * Map request body to update customer payment payload
   */
  static toUpdate(body, userId) {
    const allocations = (body.allocations || []).map((alloc) => ({
      id: alloc.id || undefined,
      salesInvoiceId: alloc.salesInvoiceId,
      allocatedAmount: parseFloat(alloc.allocatedAmount) || 0,
    }));

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    return {
      customerId: body.customerId,
      paymentDate: body.paymentDate,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      amount: parseFloat(body.amount || totalAllocated || 0),
      reference: body.reference || null,
      bankAccountId: body.bankAccountId || null,
      paymentAccountId: body.paymentAccountId || null,
      customerAccountId: body.customerAccountId || null,
      notes: body.notes || null,
      updatedBy: userId,
      allocations,
    };
  }

  /**
   * Map customer payment model to list response (summary)
   */
  static toList(record) {
    return {
      id: record.id,
      paymentNumber: record.paymentNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      paymentDate: record.paymentDate,
      paymentMethod: record.paymentMethod,
      amount: parseFloat(record.amount || 0),
      reference: record.reference,
      bankAccountId: record.bankAccountId,
      bankAccountName: record.bankAccount ? `${record.bankAccount.code} - ${record.bankAccount.name}` : '',
      paymentAccountId: record.paymentAccountId || null,
      paymentAccountName: record.paymentAccount ? `${record.paymentAccount.code} - ${record.paymentAccount.name}` : '',
      customerAccountId: record.customerAccountId || null,
      customerAccountName: record.customerAccount ? `${record.customerAccount.code} - ${record.customerAccount.name}` : '',
      status: record.status,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Map customer payment model to detail response (with allocations)
   */
  static toDetail(record) {
    return {
      id: record.id,
      paymentNumber: record.paymentNumber,
      customerId: record.customerId,
      customerName: record.customer ? record.customer.name : '',
      paymentDate: record.paymentDate,
      paymentMethod: record.paymentMethod,
      amount: parseFloat(record.amount || 0),
      reference: record.reference,
      bankAccountId: record.bankAccountId,
      bankAccountName: record.bankAccount ? `${record.bankAccount.code} - ${record.bankAccount.name}` : '',
      paymentAccountId: record.paymentAccountId || null,
      paymentAccount: record.paymentAccount ? { id: record.paymentAccount.id, code: record.paymentAccount.code, name: record.paymentAccount.name } : null,
      customerAccountId: record.customerAccountId || null,
      customerAccount: record.customerAccount ? { id: record.customerAccount.id, code: record.customerAccount.code, name: record.customerAccount.name } : null,
      journalEntryId: record.journalEntryId,
      notes: record.notes,
      status: record.status,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      allocations: (record.allocations || []).map((alloc) => ({
        id: alloc.id,
        salesInvoiceId: alloc.salesInvoiceId,
        invoiceNumber: alloc.invoice ? alloc.invoice.invoiceNumber : '',
        allocatedAmount: parseFloat(alloc.allocatedAmount || 0),
      })),
    };
  }
}

module.exports = CustomerPaymentDTO;