'use strict';

/**
 * Report Registry - Maps report route names to stored procedure names and metadata.
 * This is the single source of truth for all available reports.
 * The route name (key) is used in the URL: GET /api/reports/:reportName
 */
const reportRegistry = {
  'general-ledger': {
    procedure: 'sp_Report_GeneralLedger',
    permission: 'reports.financial.view',
    title: 'General Ledger',
    category: 'financial',
    params: ['p_AccountId', 'p_DateFrom', 'p_DateTo', 'p_JournalNumber', 'p_ReferenceNumber', 'p_Page', 'p_PageSize'],
  },
  'accounts-receivable': {
    procedure: 'sp_Report_AccountsReceivable',
    permission: 'reports.financial.view',
    title: 'Accounts Receivable',
    category: 'financial',
    params: ['p_CustomerId', 'p_DateFrom', 'p_DateTo', 'p_AgingAsOfDate', 'p_IncludeZeroBalance', 'p_Page', 'p_PageSize'],
  },
  'accounts-payable': {
    procedure: 'sp_Report_AccountsPayable',
    permission: 'reports.financial.view',
    title: 'Accounts Payable',
    category: 'financial',
    params: ['p_SupplierId', 'p_DateFrom', 'p_DateTo', 'p_AgingAsOfDate', 'p_IncludeZeroBalance', 'p_Page', 'p_PageSize'],
  },
  'sales-analytics': {
    procedure: 'sp_Report_SalesAnalytics',
    permission: 'reports.sales.view',
    title: 'Sales Analytics',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_ItemId', 'p_CategoryId', 'p_WarehouseId', 'p_GroupBy', 'p_Page', 'p_PageSize'],
  },
  'purchase-analytics': {
    procedure: 'sp_Report_PurchaseAnalytics',
    permission: 'reports.purchase.view',
    title: 'Purchase Analytics',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_ItemId', 'p_CategoryId', 'p_WarehouseId', 'p_GroupBy', 'p_Page', 'p_PageSize'],
  },
  'stock-summary': {
    procedure: 'sp_Report_StockSummary',
    permission: 'reports.inventory.view',
    title: 'Stock Summary',
    category: 'inventory',
    params: ['p_WarehouseId', 'p_ItemId', 'p_CategoryId', 'p_ItemType', 'p_IncludeZeroStock', 'p_IncludeInactive', 'p_Page', 'p_PageSize'],
  },
  'sales-order-analysis': {
    procedure: 'sp_Report_SalesOrderAnalysis',
    permission: 'reports.sales.view',
    title: 'Sales Order Analysis',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Status', 'p_Page', 'p_PageSize'],
  },
  'sales-order-trends': {
    procedure: 'sp_Report_SalesOrderTrends',
    permission: 'reports.sales.view',
    title: 'Sales Order Trends',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'quotation-trends': {
    procedure: 'sp_Report_QuotationTrends',
    permission: 'reports.sales.view',
    title: 'Quotation Trends',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'sales-invoice-trends': {
    procedure: 'sp_Report_SalesInvoiceTrends',
    permission: 'reports.sales.view',
    title: 'Sales Invoice Trends',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'delivery-note-trends': {
    procedure: 'sp_Report_DeliveryNoteTrends',
    permission: 'reports.sales.view',
    title: 'Delivery Note Trends',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'delivered-items-to-be-billed': {
    procedure: 'sp_Report_DeliveredItemsToBeBilled',
    permission: 'reports.sales.view',
    title: 'Delivered Items To Be Billed',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'sales-payment-summary': {
    procedure: 'sp_Report_SalesPaymentSummary',
    permission: 'reports.sales.view',
    title: 'Sales Payment Summary',
    category: 'sales',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'customer-ledger': {
    procedure: 'sp_Report_CustomerLedgerSummary',
    permission: 'reports.sales.view',
    title: 'Customer Ledger Summary',
    category: 'sales',
    params: ['p_CustomerId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'customer-credit-balance': {
    procedure: 'sp_Report_CustomerCreditBalance',
    permission: 'reports.sales.view',
    title: 'Customer Credit Balance',
    category: 'sales',
    params: ['p_Page', 'p_PageSize'],
  },
  'inactive-customers': {
    procedure: 'sp_Report_InactiveCustomers',
    permission: 'reports.sales.view',
    title: 'Inactive Customers',
    category: 'sales',
    params: ['p_Page', 'p_PageSize'],
  },
  'purchase-order-analysis': {
    procedure: 'sp_Report_PurchaseOrderAnalysis',
    permission: 'reports.purchase.view',
    title: 'Purchase Order Analysis',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Status', 'p_Page', 'p_PageSize'],
  },
  'purchase-order-trends': {
    procedure: 'sp_Report_PurchaseOrderTrends',
    permission: 'reports.purchase.view',
    title: 'Purchase Order Trends',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Page', 'p_PageSize'],
  },
  'purchase-invoice-trends': {
    procedure: 'sp_Report_PurchaseInvoiceTrends',
    permission: 'reports.purchase.view',
    title: 'Purchase Invoice Trends',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Page', 'p_PageSize'],
  },
  'purchase-receipt-trends': {
    procedure: 'sp_Report_PurchaseReceiptTrends',
    permission: 'reports.purchase.view',
    title: 'Purchase Receipt Trends',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Page', 'p_PageSize'],
  },
  'item-wise-purchase-history': {
    procedure: 'sp_Report_ItemWisePurchaseHistory',
    permission: 'reports.purchase.view',
    title: 'Item-wise Purchase History',
    category: 'purchase',
    params: ['p_ItemId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'received-items-to-be-billed': {
    procedure: 'sp_Report_ReceivedItemsToBeBilled',
    permission: 'reports.purchase.view',
    title: 'Received Items To Be Billed',
    category: 'purchase',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Page', 'p_PageSize'],
  },
  'supplier-ledger': {
    procedure: 'sp_Report_SupplierLedgerSummary',
    permission: 'reports.purchase.view',
    title: 'Supplier Ledger Summary',
    category: 'purchase',
    params: ['p_SupplierId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'profit-and-loss': {
    procedure: 'sp_Report_ProfitAndLoss',
    permission: 'reports.financial.view',
    title: 'Profit & Loss',
    category: 'financial',
    params: ['p_DateFrom', 'p_DateTo', 'p_IncludeZeroBalance', 'p_Page', 'p_PageSize'],
  },
  'trial-balance': {
    procedure: 'sp_Report_TrialBalance',
    permission: 'reports.financial.view',
    title: 'Trial Balance',
    category: 'financial',
    params: ['p_AsOfDate', 'p_DateFrom', 'p_DateTo', 'p_IncludeZeroBalance', 'p_Page', 'p_PageSize'],
  },
  'balance-sheet': {
    procedure: 'sp_Report_BalanceSheet',
    permission: 'reports.financial.view',
    title: 'Balance Sheet',
    category: 'financial',
    params: ['p_AsOfDate', 'p_DateFrom', 'p_DateTo', 'p_IncludeZeroBalance', 'p_Page', 'p_PageSize'],
  },
  'cash-flow': {
    procedure: 'sp_Report_CashFlow',
    permission: 'reports.financial.view',
    title: 'Cash Flow',
    category: 'financial',
    params: ['p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'gross-profit': {
    procedure: 'sp_Report_GrossProfit',
    permission: 'reports.financial.view',
    title: 'Gross Profit',
    category: 'financial',
    params: ['p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'profitability-analysis': {
    procedure: 'sp_Report_ProfitabilityAnalysis',
    permission: 'reports.financial.view',
    title: 'Profitability Analysis',
    category: 'financial',
    params: ['p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'stock-movement': {
    procedure: 'sp_Report_StockMovementHistory',
    permission: 'reports.inventory.view',
    title: 'Stock Movement History',
    category: 'inventory',
    params: ['p_ItemId', 'p_WarehouseId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'stock-valuation': {
    procedure: 'sp_Report_StockValuation',
    permission: 'reports.inventory.view',
    title: 'Stock Valuation',
    category: 'inventory',
    params: ['p_WarehouseId', 'p_CategoryId', 'p_Page', 'p_PageSize'],
  },
  'low-stock': {
    procedure: 'sp_Report_LowStock',
    permission: 'reports.inventory.view',
    title: 'Low Stock Report',
    category: 'inventory',
    params: ['p_WarehouseId', 'p_Page', 'p_PageSize'],
  },
  'stock-adjustment-history': {
    procedure: 'sp_Report_StockAdjustmentHistory',
    permission: 'reports.inventory.view',
    title: 'Stock Adjustment History',
    category: 'inventory',
    params: ['p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'stock-transfer-history': {
    procedure: 'sp_Report_StockTransferHistory',
    permission: 'reports.inventory.view',
    title: 'Stock Transfer History',
    category: 'inventory',
    params: ['p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'item-ledger': {
    procedure: 'sp_Report_ItemLedger',
    permission: 'reports.inventory.view',
    title: 'Item Ledger',
    category: 'inventory',
    params: ['p_ItemId', 'p_WarehouseId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'bank-ledger': {
    procedure: 'sp_Report_BankAccountLedger',
    permission: 'reports.banking.view',
    title: 'Bank Account Ledger',
    category: 'banking',
    params: ['p_BankAccountId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'bank-transaction-summary': {
    procedure: 'sp_Report_BankTransactionSummary',
    permission: 'reports.banking.view',
    title: 'Bank Transaction Summary',
    category: 'banking',
    params: ['p_BankAccountId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
  'payment-receipt-summary': {
    procedure: 'sp_Report_PaymentReceiptSummary',
    permission: 'reports.banking.view',
    title: 'Payment Receipt Summary',
    category: 'banking',
    params: ['p_DateFrom', 'p_DateTo', 'p_CustomerId', 'p_Page', 'p_PageSize'],
  },
  'payment-voucher-summary': {
    procedure: 'sp_Report_PaymentVoucherSummary',
    permission: 'reports.banking.view',
    title: 'Payment Voucher Summary',
    category: 'banking',
    params: ['p_DateFrom', 'p_DateTo', 'p_SupplierId', 'p_Page', 'p_PageSize'],
  },
  'reconciliation-summary': {
    procedure: 'sp_Report_BankReconciliationSummary',
    permission: 'reports.banking.view',
    title: 'Reconciliation Summary',
    category: 'banking',
    params: ['p_BankAccountId', 'p_DateFrom', 'p_DateTo', 'p_Page', 'p_PageSize'],
  },
};

/** Get report config by route name */
function getReportConfig(routeName) {
  return reportRegistry[routeName] || null;
}

/** Get all report configs */
function getAllReports() {
  return Object.entries(reportRegistry).map(([route, config]) => ({
    route,
    ...config,
  }));
}

module.exports = { reportRegistry, getReportConfig, getAllReports };
