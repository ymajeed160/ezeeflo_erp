'use strict';

const resourceIncomeRepository = require('../repositories/ResourceIncomeRepository');

/**
 * ResourceIncomeService — analytical attribution ONLY.
 *
 * Maintains the `resource_income` snapshot records used by the
 * "Resource Income" report. It MUST NEVER create, update, reverse,
 * or otherwise modify journal entries, ledger postings, or any other
 * accounting transaction. Accounting continues to flow exclusively
 * through JournalEntryService (SalesInvoiceService.post/cancel).
 */
class ResourceIncomeService {
  /**
   * Create/refresh the analytical snapshot when an invoice is posted.
   * Returns null when the invoice has no selling resource (nothing to do).
   */
  static async syncForInvoice(invoice, transaction) {
    if (!invoice || !invoice.sellingResourceId) {
      return null;
    }

    const netAmount = parseFloat(invoice.subTotal || 0) - parseFloat(invoice.discountTotal || 0);
    const taxAmount = parseFloat(invoice.taxTotal || 0);
    const grossAmount = parseFloat(invoice.grandTotal || 0);
    const userId = invoice.updatedBy || invoice.createdBy;

    const data = {
      tenantId: invoice.tenantId,
      salesInvoiceId: invoice.id,
      resourceId: invoice.sellingResourceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      customerId: invoice.customerId,
      netAmount,
      taxAmount,
      grossAmount,
      incomeAmount: netAmount,
      status: 'posted',
      createdBy: userId,
      updatedBy: userId,
    };

    return resourceIncomeRepository.upsertForInvoice(data, transaction);
  }

  /**
   * Mark the analytical snapshot as cancelled when the invoice is cancelled.
   * No ledger reversal is performed here (handled by SalesInvoiceService.cancel).
   */
  static async cancelForInvoice(invoice, transaction) {
    if (!invoice || !invoice.sellingResourceId) {
      return null;
    }
    const userId = invoice.updatedBy || invoice.createdBy;
    return resourceIncomeRepository.markCancelled(invoice.id, invoice.tenantId, userId, transaction);
  }
}

module.exports = ResourceIncomeService;
