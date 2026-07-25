const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const ApiResponse = require('./utils/apiResponse');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const accountRoutes = require('./routes/accountRoutes');
const journalEntryRoutes = require('./routes/journalEntryRoutes');
const generalLedgerRoutes = require('./routes/generalLedgerRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const itemCategoryRoutes = require('./routes/itemCategoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const stockAdjustmentRoutes = require('./routes/stockAdjustmentRoutes');
const stockTransferRoutes = require('./routes/stockTransferRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customer.routes');
const quotationRoutes = require('./routes/quotation.routes');
const salesOrderRoutes = require('./routes/salesOrder.routes');
const deliveryNoteRoutes = require('./routes/deliveryNote.routes');
const salesInvoiceRoutes = require('./routes/salesInvoice.routes');
const salesReturnRoutes = require('./routes/salesReturn.routes');
const creditNoteRoutes = require('./routes/creditNote.routes');
const customerPaymentRoutes = require('./routes/customerPayment.routes');
const supplierRoutes = require('./routes/supplier.routes');
const purchaseRequestRoutes = require('./routes/purchaseRequest.routes');
const purchaseOrderRoutes = require('./routes/purchaseOrder.routes');
const goodsReceiptRoutes = require('./routes/goodsReceipt.routes');
const purchaseInvoiceRoutes = require('./routes/purchaseInvoice.routes');
const purchaseReturnRoutes = require('./routes/purchaseReturn.routes');
const debitNoteRoutes = require('./routes/debitNote.routes');
const supplierPaymentRoutes = require('./routes/supplierPayment.routes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const bankTransactionRoutes = require('./routes/bankTransactionRoutes');
const paymentReceiptRoutes = require('./routes/paymentReceiptRoutes');
const paymentVoucherRoutes = require('./routes/paymentVoucherRoutes');
const bankReconciliationRoutes = require('./routes/bankReconciliationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./reports/report.routes');
const biRoutes = require('./routes/biRoutes');
const systemConfigRoutes = require('./routes/systemConfigRoutes');
const companyRoutes = require('./routes/companyRoutes');
const assetCategoryRoutes = require('./routes/assetCategoryRoutes');
const assetRoutes = require('./routes/assetRoutes');
const assetAcquisitionRoutes = require('./routes/assetAcquisitionRoutes');
const assetTransferRoutes = require('./routes/assetTransferRoutes');
const assetDepreciationRoutes = require('./routes/assetDepreciationRoutes');
const assetDisposalRoutes = require('./routes/assetDisposalRoutes');
const assetRevaluationRoutes = require('./routes/assetRevaluationRoutes');
const assetMaintenanceRoutes = require('./routes/assetMaintenanceRoutes');
const assetInsuranceRoutes = require('./routes/assetInsuranceRoutes');
const assetLocationRoutes = require('./routes/assetLocationRoutes');
const assetCustodianRoutes = require('./routes/assetCustodianRoutes');
const assetAuditRoutes = require('./routes/assetAuditRoutes');
const fixedAssetReportRoutes = require('./routes/fixedAssetReportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');
const { companyMiddleware } = require('./middleware/companyMiddleware');

// Super Admin routes
const pdfPreviewRoutes = require('./routes/pdfPreviewRoutes');
const superAdminRoutes = require('./superadmin/routes/index');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : (process.env.APP_URL ? [process.env.APP_URL] : ['http://localhost:3001']),
  credentials: true,
}));

// Rate limiting — general API throttle
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', generalLimiter);

// Rate limiting — strict throttle for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
});
app.use('/api/auth', authLimiter);

// Request parsing with security hardening
app.use(express.json({
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({
  extended: false,
  limit: '1mb',
  parameterLimit: 1000,
}));
app.use(cookieParser());

// Compression
app.use(compression());

// Serve uploaded files statically (logos, images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// Swagger API documentation
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui .info .title { font-size: 28px } .swagger-ui { max-width: 1200px; margin: 0 auto }',
  customSiteTitle: 'ERP Multi-Tenant API Docs',
  customfavIcon: '/uploads/favicon.ico',
};
// Serve JSON spec for API clients
app.get('/api', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('application/json') || accept.includes('text/plain')) {
    return ApiResponse.success(res, {
      message: 'ERP Multi-Tenant API',
      data: {
        version: '1.0.0',
        swagger: '/api/docs',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          users: '/api/users',
          roles: '/api/roles',
          permissions: '/api/permissions',
          accounts: '/api/accounts',
          journalEntries: '/api/journal-entries',
          generalLedger: '/api/general-ledger',
          tenant: '/api/tenant',
          itemCategories: '/api/item-categories',
          items: '/api/items',
          warehouses: '/api/warehouses',
          stockAdjustments: '/api/stock-adjustments',
          stockTransfers: '/api/stock-transfers',
          inventory: '/api/inventory',
          customers: '/api/customers',
          quotations: '/api/quotations',
          salesOrders: '/api/sales-orders',
          deliveryNotes: '/api/delivery-notes',
          salesInvoices: '/api/sales-invoices',
          salesReturns: '/api/sales-returns',
          creditNotes: '/api/credit-notes',
          customerPayments: '/api/customer-payments',
          suppliers: '/api/suppliers',
          purchaseRequests: '/api/purchase-requests',
          purchaseOrders: '/api/purchase-orders',
          goodsReceipts: '/api/goods-receipts',
          purchaseInvoices: '/api/purchase-invoices',
          purchaseReturns: '/api/purchase-returns',
          debitNotes: '/api/debit-notes',
          supplierPayments: '/api/supplier-payments',
          bankAccounts: '/api/bank-accounts',
          bankTransactions: '/api/bank-transactions',
          paymentReceipts: '/api/payment-receipts',
          paymentVouchers: '/api/payment-vouchers',
          bankReconciliations: '/api/bank-reconciliations',
          assetCategories: '/api/asset-categories',
          assets: '/api/assets',
          assetAcquisitions: '/api/asset-acquisitions',
          assetTransfers: '/api/asset-transfers',
          assetDepreciations: '/api/asset-depreciations',
          assetDisposals: '/api/asset-disposals',
          assetRevaluations: '/api/asset-revaluations',
          assetMaintenances: '/api/asset-maintenances',
          assetInsurances: '/api/asset-insurances',
          assetLocations: '/api/asset-locations',
          assetCustodians: '/api/asset-custodians',
          assetAudits: '/api/asset-audits',
          fixedAssetReports: '/api/fixed-asset-reports',
        },
      },
    });
  }
  // Redirect browser visits to Swagger UI
  res.redirect('/api/docs');
});
// Serve Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
// Serve raw OpenAPI JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/api/health', (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('application/json') || accept.includes('text/plain')) {
    return ApiResponse.success(res, {
      message: 'ERP Multi-Tenant API is running',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  }
  res.sendFile(path.join(__dirname, 'views', 'health.html'));
});

// PDF preview — no auth required (iframe loads this)
app.use('/api/pdf-preview', pdfPreviewRoutes);

// Routes that do NOT require company context
app.use('/api/auth', authRoutes);

// Company routes — companyMiddleware applied selectively inside
app.use('/api/companies', companyRoutes);

// All business routes below require authentication + company context
const businessRoutes = [
  { path: '/api/users', router: userRoutes },
  { path: '/api/roles', router: roleRoutes },
  { path: '/api/permissions', router: permissionRoutes },
  { path: '/api/accounts', router: accountRoutes },
  { path: '/api/journal-entries', router: journalEntryRoutes },
  { path: '/api/general-ledger', router: generalLedgerRoutes },
  { path: '/api/tenant', router: tenantRoutes },
  { path: '/api/item-categories', router: itemCategoryRoutes },
  { path: '/api/items', router: itemRoutes },
  { path: '/api/warehouses', router: warehouseRoutes },
  { path: '/api/stock-adjustments', router: stockAdjustmentRoutes },
  { path: '/api/stock-transfers', router: stockTransferRoutes },
  { path: '/api/inventory', router: inventoryRoutes },
  { path: '/api/customers', router: customerRoutes },
  { path: '/api/quotations', router: quotationRoutes },
  { path: '/api/sales-orders', router: salesOrderRoutes },
  { path: '/api/delivery-notes', router: deliveryNoteRoutes },
  { path: '/api/sales-invoices', router: salesInvoiceRoutes },
  { path: '/api/sales-returns', router: salesReturnRoutes },
  { path: '/api/credit-notes', router: creditNoteRoutes },
  { path: '/api/customer-payments', router: customerPaymentRoutes },
  { path: '/api/suppliers', router: supplierRoutes },
  { path: '/api/purchase-requests', router: purchaseRequestRoutes },
  { path: '/api/purchase-orders', router: purchaseOrderRoutes },
  { path: '/api/goods-receipts', router: goodsReceiptRoutes },
  { path: '/api/purchase-invoices', router: purchaseInvoiceRoutes },
  { path: '/api/purchase-returns', router: purchaseReturnRoutes },
  { path: '/api/debit-notes', router: debitNoteRoutes },
  { path: '/api/supplier-payments', router: supplierPaymentRoutes },
  { path: '/api/bank-accounts', router: bankAccountRoutes },
  { path: '/api/bank-transactions', router: bankTransactionRoutes },
  { path: '/api/payment-receipts', router: paymentReceiptRoutes },
  { path: '/api/payment-vouchers', router: paymentVoucherRoutes },
  { path: '/api/bank-reconciliations', router: bankReconciliationRoutes },
  { path: '/api/dashboard', router: dashboardRoutes },
  { path: '/api/reports', router: reportRoutes },
  { path: '/api/bi', router: biRoutes },
  { path: '/api/settings', router: systemConfigRoutes },
  { path: '/api/asset-categories', router: assetCategoryRoutes },
  { path: '/api/assets', router: assetRoutes },
  { path: '/api/asset-acquisitions', router: assetAcquisitionRoutes },
  { path: '/api/asset-transfers', router: assetTransferRoutes },
  { path: '/api/asset-depreciations', router: assetDepreciationRoutes },
  { path: '/api/asset-disposals', router: assetDisposalRoutes },
  { path: '/api/asset-revaluations', router: assetRevaluationRoutes },
  { path: '/api/asset-maintenances', router: assetMaintenanceRoutes },
  { path: '/api/asset-insurances', router: assetInsuranceRoutes },
  { path: '/api/asset-locations', router: assetLocationRoutes },
  { path: '/api/asset-custodians', router: assetCustodianRoutes },
  { path: '/api/asset-audits', router: assetAuditRoutes },
  { path: '/api/fixed-asset-reports', router: fixedAssetReportRoutes },
  { path: '/api/audit-logs', router: auditRoutes },
];

// Auth must run BEFORE company middleware so req.user is populated
for (const { path, router } of businessRoutes) {
  app.use(path, authMiddleware, companyMiddleware, router);
}

// Super Admin routes — separate prefix, no company middleware
app.use('/api/superadmin', superAdminRoutes);

// 404 handler — only for API routes; non-API routes pass through
// so a parent server.js (e.g. in deployment) can serve the React SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return ApiResponse.notFound(res, { message: `Route ${req.originalUrl} not found` });
  }
  next();
});

// Global error handler
app.use(errorHandler);

module.exports = app;