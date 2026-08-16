'use strict';

class PosSessionDTO {
  static toDetail(session) {
    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      terminal: session.terminal ? { id: session.terminal.id, name: session.terminal.terminalName, code: session.terminal.terminalCode } : null,
      cashier: session.cashier ? { id: session.cashier.id, name: session.cashier.name } : null,
      warehouse: session.warehouse ? { id: session.warehouse.id, name: session.warehouse.name } : null,
      openingDate: session.openingDate,
      closingDate: session.closingDate,
      openingCash: parseFloat(session.openingCash),
      closingCash: parseFloat(session.closingCash),
      expectedCash: parseFloat(session.expectedCash),
      actualCash: parseFloat(session.actualCash),
      cashDifference: parseFloat(session.cashDifference),
      totals: {
        cashSales: parseFloat(session.cashSalesTotal || 0),
        cardSales: parseFloat(session.cardSalesTotal || 0),
        bankSales: parseFloat(session.bankSalesTotal || 0),
        creditSales: parseFloat(session.creditSalesTotal || 0),
        cashIn: parseFloat(session.cashInTotal || 0),
        cashOut: parseFloat(session.cashOutTotal || 0),
        refunds: parseFloat(session.refundTotal || 0),
      },
      totalSalesCount: session.totalSalesCount,
      status: session.status,
      openingNotes: session.openingNotes,
      closingNotes: session.closingNotes,
      managerApproved: session.managerApproved,
      manager: session.manager ? { id: session.manager.id, name: session.manager.name } : null,
      createdAt: session.createdAt,
    };
  }
}

module.exports = PosSessionDTO;
