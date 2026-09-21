'use strict';

class CashReceiptVoucherDTO {
  toList(voucher) {
    const v = voucher.toJSON ? voucher.toJSON() : voucher;
    return {
      id: v.id,
      voucherNumber: v.voucherNumber,
      voucherDate: v.voucherDate,
      cashAccountName: v.cashAccount?.name || null,
      cashAccountCode: v.cashAccount?.code || null,
      payerType: v.payerType,
      payerName: v.payerName,
      referenceNumber: v.referenceNumber,
      totalAmount: parseFloat(v.totalAmount || 0),
      allocatedAmount: parseFloat(v.allocatedAmount || 0),
      unallocatedAmount: parseFloat(v.unallocatedAmount || 0),
      currency: v.currency,
      status: v.status,
      createdBy: v.creator ? `${v.creator.firstName} ${v.creator.lastName}` : null,
      postedBy: v.poster ? `${v.poster.firstName} ${v.poster.lastName}` : null,
      journalEntryId: v.journalEntryId,
      createdAt: v.createdAt,
      postedAt: v.postedAt,
    };
  }

  toDetail(voucher) {
    const v = voucher.toJSON ? voucher.toJSON() : voucher;
    return {
      ...this.toList(v),
      branchId: v.branchId,
      cashAccountId: v.cashAccountId,
      cashAccount: v.cashAccount ? { id: v.cashAccount.id, code: v.cashAccount.code, name: v.cashAccount.name } : null,
      payerId: v.payerId,
      paymentMethod: v.paymentMethod,
      exchangeRate: parseFloat(v.exchangeRate || 1),
      description: v.description,
      subtotal: parseFloat(v.subtotal || 0),
      taxAmount: parseFloat(v.taxAmount || 0),
      journalEntry: v.journalEntry ? { id: v.journalEntry.id, entryNumber: v.journalEntry.entryNumber } : null,
      lines: (v.lines || []).map(l => ({
        id: l.id,
        lineNumber: l.lineNumber,
        accountId: l.accountId,
        accountCode: l.account?.code || null,
        accountName: l.account?.name || null,
        partyId: l.partyId,
        description: l.description,
        amount: parseFloat(l.amount || 0),
        taxId: l.taxId,
        taxRate: parseFloat(l.taxRate || 0),
        taxAmount: parseFloat(l.taxAmount || 0),
        totalAmount: parseFloat(l.totalAmount || 0),
        costCenterId: l.costCenterId,
        departmentId: l.departmentId,
        projectId: l.projectId,
      })),
    };
  }
}

module.exports = new CashReceiptVoucherDTO();
