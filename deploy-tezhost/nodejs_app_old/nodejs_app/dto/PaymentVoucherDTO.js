class PaymentVoucherDTO {
  static toResponse(voucher) {
    if (!voucher) return null;
    const data = voucher.toJSON ? voucher.toJSON() : voucher;
    return {
      id: data.id, tenantId: data.tenantId,
      voucherNumber: data.voucherNumber, voucherDate: data.voucherDate,
      supplierId: data.supplierId,
      supplier: data.supplier ? { id: data.supplier.id, code: data.supplier.code, name: data.supplier.name } : null,
      bankAccountId: data.bankAccountId,
      bankAccount: data.bankAccount ? { id: data.bankAccount.id, accountCode: data.bankAccount.accountCode, accountName: data.bankAccount.accountName } : null,
      paymentMethod: data.paymentMethod, referenceNumber: data.referenceNumber,
      amount: parseFloat(data.amount || 0), currencyCode: data.currencyCode,
      exchangeRate: data.exchangeRate ? parseFloat(data.exchangeRate) : 1.0,
      paidTo: data.paidTo, paymentPurpose: data.paymentPurpose,
      status: data.status, journalEntryId: data.journalEntryId,
      journalEntry: data.journalEntry ? { id: data.journalEntry.id, entryNumber: data.journalEntry.entryNumber } : null,
      notes: data.notes,
      allocations: data.allocations ? data.allocations.map((a) => ({
        id: a.id, purchaseInvoiceId: a.purchaseInvoiceId,
        allocatedAmount: parseFloat(a.allocatedAmount || 0),
        invoice: a.invoice ? { id: a.invoice.id, invoiceNumber: a.invoice.invoiceNumber, grandTotal: parseFloat(a.invoice.grandTotal || 0) } : null,
      })) : [],
      lines: data.lines ? data.lines.map((l) => ({
        id: l.id, accountId: l.accountId, description: l.description,
        amount: parseFloat(l.amount || 0), taxPercentage: parseFloat(l.taxPercentage || 0),
        taxAccountId: l.taxAccountId,
        account: l.account ? { id: l.account.id, code: l.account.code, name: l.account.name } : null,
      })) : [],
      createdBy: data.createdBy, updatedBy: data.updatedBy,
      createdAt: data.createdAt, updatedAt: data.updatedAt,
    };
  }
  static toListResponse(vouchers) { return vouchers?.map((v) => PaymentVoucherDTO.toResponse(v)) || []; }
}
module.exports = PaymentVoucherDTO;
