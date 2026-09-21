'use strict';

const reportService = require('../reports/report.service');
const logger = require('../utils/logger');

/**
 * BIController — Aggregates data from existing stored procedures into BI dashboards.
 * Uses only the registered report SPs — no new SQL/business logic.
 */
class BIController {

  /**
   * Helper: Execute a registered report and return its data safely.
   */
  async _fetchReport(reportRoute, params, tenantId) {
    try {
      const result = await reportService.executeReport(reportRoute, params, tenantId);
      return result;
    } catch (err) {
      logger.warn(`BI report fetch warning for '${reportRoute}': ${err.message}`);
      return { summary: null, data: [], pagination: null };
    }
  }

  /**
   * GET /api/bi/sales-dashboard
   * Aggregates: sales-analytics, sales-order-analysis, sales-invoice-trends, customer-ledger
   */
  async getSalesDashboard(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { dateFrom, dateTo, customerId, status } = req.query;
      const baseParams = { dateFrom, dateTo, page: 1, pageSize: 100 };

      const [analytics, orderAnalysis, invoiceTrends, customerLedger] = await Promise.all([
        this._fetchReport('sales-analytics', { ...baseParams, customerId, status }, tenantId),
        this._fetchReport('sales-order-analysis', { ...baseParams, customerId, status }, tenantId),
        this._fetchReport('sales-invoice-trends', { ...baseParams, period: 'monthly' }, tenantId),
        this._fetchReport('customer-ledger', { ...baseParams, customerId, pageSize: 10 }, tenantId),
      ]);

      res.json({
        success: true,
        data: {
          summary: analytics.summary,
          orderAnalysis: orderAnalysis.data,
          invoiceTrends: invoiceTrends.data,
          customers: customerLedger.data,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bi/purchase-dashboard
   * Aggregates: purchase-analytics, purchase-order-analysis, purchase-invoice-trends, supplier-ledger
   */
  async getPurchaseDashboard(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { dateFrom, dateTo, supplierId, status } = req.query;
      const baseParams = { dateFrom, dateTo, page: 1, pageSize: 100 };

      const [analytics, orderAnalysis, invoiceTrends, supplierLedger] = await Promise.all([
        this._fetchReport('purchase-analytics', { ...baseParams, supplierId, status }, tenantId),
        this._fetchReport('purchase-order-analysis', { ...baseParams, supplierId, status }, tenantId),
        this._fetchReport('purchase-invoice-trends', { ...baseParams, period: 'monthly' }, tenantId),
        this._fetchReport('supplier-ledger', { ...baseParams, supplierId, pageSize: 10 }, tenantId),
      ]);

      res.json({
        success: true,
        data: {
          summary: analytics.summary,
          orderAnalysis: orderAnalysis.data,
          invoiceTrends: invoiceTrends.data,
          suppliers: supplierLedger.data,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bi/inventory-dashboard
   * Aggregates: stock-summary, stock-valuation, low-stock, stock-movement
   */
  async getInventoryDashboard(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { dateFrom, dateTo, itemId, warehouseId, categoryId } = req.query;
      const baseParams = { dateFrom, dateTo, page: 1, pageSize: 100 };

      const [stockSummary, stockValuation, lowStock, stockMovement] = await Promise.all([
        this._fetchReport('stock-summary', { ...baseParams, warehouseId, categoryId }, tenantId),
        this._fetchReport('stock-valuation', { ...baseParams, warehouseId }, tenantId),
        this._fetchReport('low-stock', { warehouseId }, tenantId),
        this._fetchReport('stock-movement', { ...baseParams, itemId, warehouseId }, tenantId),
      ]);

      res.json({
        success: true,
        data: {
          summary: stockSummary.summary,
          stockValuation: stockValuation.data,
          lowStock: lowStock.data,
          recentMovements: stockMovement.data,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bi/financial-dashboard
   * Aggregates: profit-and-loss, balance-sheet, trial-balance, cash-flow, gross-profit
   */
  async getFinancialDashboard(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { dateFrom, dateTo, asOfDate } = req.query;
      const baseParams = { dateFrom, dateTo, page: 1, pageSize: 100 };
      const pnlParams = { ...baseParams, includeZeroBalance: 'false' };
      const bsParams = { ...baseParams, asOfDate: asOfDate || dateTo, includeZeroBalance: 'false' };

      const [pnl, balanceSheet, trialBalance, cashFlow, grossProfit] = await Promise.all([
        this._fetchReport('profit-and-loss', pnlParams, tenantId),
        this._fetchReport('balance-sheet', bsParams, tenantId),
        this._fetchReport('trial-balance', { ...baseParams, asOfDate: asOfDate || dateTo, includeZeroBalance: 'false' }, tenantId),
        this._fetchReport('cash-flow', baseParams, tenantId),
        this._fetchReport('gross-profit', baseParams, tenantId),
      ]);

      res.json({
        success: true,
        data: {
          pnl: pnl.summary,
          pnlData: pnl.data,
          balanceSheet: balanceSheet.summary,
          balanceSheetData: balanceSheet.data,
          trialBalance: trialBalance.data,
          cashFlow: cashFlow.data,
          grossProfit: grossProfit.summary,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BIController();
