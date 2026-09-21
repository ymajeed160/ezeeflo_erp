'use strict';

class PosSaleDTO {
  /**
   * Transform POS sale to list view
   */
  static toList(sale) {
    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate,
      terminal: sale.terminal ? { id: sale.terminal.id, name: sale.terminal.terminalName, code: sale.terminal.terminalCode } : null,
      session: sale.session ? { id: sale.session.id, number: sale.session.sessionNumber } : null,
      cashier: sale.cashier ? { id: sale.cashier.id, name: sale.cashier.name } : null,
      customer: sale.customer ? { id: sale.customer.id, name: sale.customer.name, code: sale.customer.code } : null,
      subTotal: parseFloat(sale.subTotal),
      discountTotal: parseFloat(sale.discountTotal),
      taxTotal: parseFloat(sale.taxTotal),
      grandTotal: parseFloat(sale.grandTotal),
      status: sale.status,
      lineCount: sale.lines ? sale.lines.length : 0,
      paymentMethods: sale.payments ? sale.payments.map(p => p.paymentMethod).join(', ') : '',
      createdAt: sale.createdAt,
    };
  }

  /**
   * Transform POS sale to detail view
   */
  static toDetail(sale) {
    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate,
      terminal: sale.terminal ? { id: sale.terminal.id, name: sale.terminal.terminalName, code: sale.terminal.terminalCode } : null,
      session: sale.session ? { id: sale.session.id, number: sale.session.sessionNumber } : null,
      warehouse: sale.warehouse ? { id: sale.warehouse.id, name: sale.warehouse.name } : null,
      cashier: sale.cashier ? { id: sale.cashier.id, name: sale.cashier.name } : null,
      customer: sale.customer ? {
        id: sale.customer.id, name: sale.customer.name, code: sale.customer.code,
        phone: sale.customer.phone, email: sale.customer.email,
      } : null,
      subTotal: parseFloat(sale.subTotal),
      discountTotal: parseFloat(sale.discountTotal),
      discountPercentage: parseFloat(sale.discountPercentage),
      discountReason: sale.discountReason,
      taxTotal: parseFloat(sale.taxTotal),
      grandTotal: parseFloat(sale.grandTotal),
      status: sale.status,
      notes: sale.notes,
      journalEntryId: sale.journalEntryId,
      lines: (sale.lines || []).map(l => ({
        id: l.id,
        itemId: l.itemId,
        itemName: l.itemName,
        sku: l.sku,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        costPrice: parseFloat(l.costPrice || 0),
        discountPercentage: parseFloat(l.discountPercentage),
        discountAmount: parseFloat(l.discountAmount),
        taxPercentage: parseFloat(l.taxPercentage),
        taxAmount: parseFloat(l.taxAmount),
        lineTotal: parseFloat(l.lineTotal),
        isService: l.isService,
      })),
      payments: (sale.payments || []).map(p => ({
        id: p.id,
        method: p.paymentMethod,
        amount: parseFloat(p.amount),
        reference: p.reference,
        changeAmount: parseFloat(p.changeAmount || 0),
      })),
      createdAt: sale.createdAt,
      cancelledAt: sale.cancelledAt,
      cancelReason: sale.cancelReason,
    };
  }
}

module.exports = PosSaleDTO;
