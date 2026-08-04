class PaymentReceiptDTO {
  static toResponse(receipt) {
    if (!receipt) return null;
    const data = receipt.toJSON ? receipt.toJSON() : receipt;
    return {
      id: data.id,
      tenantId: data.tenantId,
      receiptNumber: data.receiptNumber,
      receiptDate: data.receiptDate,
      customerId: data.customerId,
      customer: data.customer ? { id: data.customer.id, code: data.customer.code, name: data.customer.name } : null,
      bankAccountId: data.bankAccountId,
      bankAccount: data.bankAccount ? { id: data.bankAccount.id, accountCode: data.bankAccount.accountCode, accountName: data.bankAccount.accountName, accountNumber: data.bankAccount.accountNumber } : null,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      amount: parseFloat(data.amount || 0),
      currencyCode: data.currencyCode,
      exchangeRate: data.exchangeRate ? parseFloat(data.exchangeRate) : 1.0,
      receivedFrom: data.receivedFrom,
      depositReference: data.depositReference,
      status: data.status,
      journalEntryId: data.journalEntryId,
      journalEntry: data.journalEntry ? { id: data.journalEntry.id, entryNumber: data.journalEntry.entryNumber } : null,
      notes: data.notes,
      allocations: data.allocations
        ? data.allocations.map((a) => ({
            id: a.id,
            salesInvoiceId: a.salesInvoiceId,
            allocatedAmount: parseFloat(a.allocatedAmount || 0),
            invoice: a.invoice ? { id: a.invoice.id, invoiceNumber: a.invoice.invoiceNumber, grandTotal: parseFloat(a.invoice.grandTotal || 0) } : null,
          }))
        : [],
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static toListResponse(receipts) {
    return receipts?.map((r) => PaymentReceiptDTO.toResponse(r)) || [];
  }
}

module.exports = PaymentReceiptDTO;
