'use strict';

const mysql = require('mysql2/promise');
const { QueryTypes } = require('sequelize');

/**
 * Whitelist of allowed stored procedure names.
 * No procedure can be executed unless it is in this list.
 */
const ALLOWED_PROCEDURES = new Set([
  'sp_Report_GeneralLedger',
  'sp_Report_AccountsReceivable',
  'sp_Report_AccountsPayable',
  'sp_Report_SalesAnalytics',
  'sp_Report_PurchaseAnalytics',
  'sp_Report_StockSummary',
  'sp_Report_SalesOrderAnalysis',
  'sp_Report_SalesOrderTrends',
  'sp_Report_QuotationTrends',
  'sp_Report_SalesInvoiceTrends',
  'sp_Report_DeliveryNoteTrends',
  'sp_Report_DeliveredItemsToBeBilled',
  'sp_Report_SalesPaymentSummary',
  'sp_Report_CustomerLedgerSummary',
  'sp_Report_CustomerCreditBalance',
  'sp_Report_InactiveCustomers',
  'sp_Report_PurchaseOrderAnalysis',
  'sp_Report_PurchaseOrderTrends',
  'sp_Report_PurchaseInvoiceTrends',
  'sp_Report_PurchaseReceiptTrends',
  'sp_Report_ItemWisePurchaseHistory',
  'sp_Report_ReceivedItemsToBeBilled',
  'sp_Report_SupplierLedgerSummary',
  'sp_Report_ProfitAndLoss',
  'sp_Report_TrialBalance',
  'sp_Report_BalanceSheet',
  'sp_Report_BalanceSheet_v2',
  'sp_Report_CashFlow',
  'sp_Report_GrossProfit',
  'sp_Report_ProfitabilityAnalysis',
  'sp_Report_TrialBalanceForParty',
  'sp_Report_PaymentPeriodBasedOnInvoiceDate',
  'sp_Report_StockMovementHistory',
  'sp_Report_StockValuation',
  'sp_Report_LowStock',
  'sp_Report_StockAdjustmentHistory',
  'sp_Report_StockTransferHistory',
  'sp_Report_ItemLedger',
  'sp_Report_BankAccountLedger',
  'sp_Report_BankTransactionSummary',
  'sp_Report_PaymentReceiptSummary',
  'sp_Report_PaymentVoucherSummary',
  'sp_Report_BankReconciliationSummary',
  // POS Reports
  'sp_Report_POS_DailySales',
  'sp_Report_POS_SalesByCashier',
  'sp_Report_POS_SalesByTerminal',
  'sp_Report_POS_SalesByItem',
  'sp_Report_POS_SalesByCategory',
  'sp_Report_POS_SalesByCustomer',
  'sp_Report_POS_PaymentSummary',
  'sp_Report_POS_CashierSession',
  'sp_Report_POS_CashVariance',
  'sp_Report_POS_Returns',
  'sp_Report_POS_Discounts',
  'sp_Report_POS_Tax',
  'sp_Report_POS_HourlySales',
  'sp_Report_POS_TopItems',
  'sp_Report_POS_StockSold',
]);

/**
 * Execute a stored procedure with parameterized replacements.
 *
 * @param {string} procedureName - The exact procedure name (must be in allowlist).
 * @param {object} params - Parameters to pass. Must be flat key-value pairs.
 * @param {object} options
 * @param {number} options.tenantId - Tenant ID (mandatory, from auth context).
 * @returns {Promise<Array>} - Array of result sets from the procedure.
 */
async function executeReportProcedure(procedureName, params = {}, options = {}) {
  if (!ALLOWED_PROCEDURES.has(procedureName)) {
    throw Object.assign(new Error(`Procedure '${procedureName}' is not in the allowed procedures list.`), { statusCode: 403 });
  }

  const { tenantId } = options;
  if (!tenantId) {
    throw Object.assign(new Error('TenantId is required for report execution.'), { statusCode: 400 });
  }

  // Build the CALL statement with named parameter placeholders.
  const paramNames = Object.keys(params);
  const placeholders = ['?', ...paramNames.map(() => '?')].join(', ');
  const callSQL = `CALL ${procedureName}(${placeholders})`;

  // Build ordered parameter array: p_TenantId first, then all other params
  const paramValues = [tenantId, ...paramNames.map((p) => params[p])];

  // Use mysql2 directly to get all result sets from the procedure
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'c28.eelserver.com',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'ezeefloc_erp',
    password: process.env.DB_PASSWORD || 'Memits@396',
    database: process.env.DB_NAME || 'ezeefloc_erp',
  });

  try {
    const [results] = await connection.query(callSQL, paramValues);
    // results is an array of result sets: [summary, data, pagination, ...]
    return results;
  } catch (err) {
    throw Object.assign(new Error(`Report procedure error: ${err.message}`), { originalError: err });
  } finally {
    await connection.end();
  }
}

module.exports = { executeReportProcedure };
