'use strict';

const tenantId = '11111111-1111-1111-1111-111111111111';
const userId = '00000000-0000-0000-0000-000000000001';

const modules = {
  // Dashboard
  dashboard: ['read', 'export'],

  // Sales
  sales: ['read', 'create', 'update', 'delete', 'approve', 'export'],
  customers: ['read', 'create', 'update', 'delete', 'export'],
  quotations: ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'sales-orders': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'delivery-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'sales-invoices': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'sales-returns': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'credit-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],

  // Purchases
  purchases: ['read', 'create', 'update', 'delete', 'approve', 'export'],
  suppliers: ['read', 'create', 'update', 'delete', 'export'],
  'purchase-requests': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'purchase-orders': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'goods-receipt-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'purchase-invoices': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'purchase-returns': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'debit-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],

  // Inventory - Item Categories
  category: ['view', 'create', 'edit', 'delete', 'export'],

  // Inventory - Items
  item: ['view', 'create', 'edit', 'delete', 'export'],

  // Inventory - Warehouses
  warehouse: ['view', 'create', 'edit', 'delete', 'export'],

  // Inventory - Stock Adjustments
  stockadjustment: ['view', 'create', 'approve', 'export'],

  // Inventory - Stock Transfers
  stocktransfer: ['view', 'create', 'approve', 'complete', 'export'],

  // Inventory - Balances & Transactions
  inventory: ['view', 'export'],

  // Accounting
  accounting: ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'chart-of-accounts': ['read', 'create', 'update', 'delete', 'export'],
  'journal-entries': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'general-ledger': ['read', 'export'],
  ledger: ['view', 'export'],
  'trial-balance': ['read', 'export'],
  'profit-loss': ['read', 'export'],
  'balance-sheet': ['read', 'export'],
  'tax-management': ['read', 'create', 'update', 'delete', 'export'],
  'fiscal-periods': ['read', 'create', 'update', 'delete', 'export'],

  // Banks
  banks: ['read', 'create', 'update', 'delete', 'export'],
  'bank-accounts': ['read', 'create', 'update', 'delete', 'export'],
  'bank-transactions': ['read', 'create', 'update', 'delete', 'export'],
  'payment-receipts': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  'payment-vouchers': ['read', 'create', 'update', 'delete', 'approve', 'export'],
  reconciliation: ['read', 'create', 'update', 'delete', 'export'],

  // Fixed Assets
  'fixed-assets': ['read', 'create', 'update', 'delete', 'transfer', 'dispose', 'depreciate', 'revalue', 'audit', 'maintenance', 'insurance', 'export'],
  'asset-categories': ['read', 'create', 'update', 'delete', 'export'],

  // Reports
  reports: ['read', 'export'],
  'sales-reports': ['read', 'export'],
  'purchase-reports': ['read', 'export'],
  'inventory-reports': ['read', 'export'],
  'financial-reports': ['read', 'export'],
  'vat-reports': ['read', 'export'],

  // Settings
  settings: ['read', 'update', 'export'],
  'company-profile': ['read', 'update'],
  'tenant-management': ['read', 'create', 'update', 'delete'],
  users: ['read', 'create', 'update', 'delete'],
  roles: ['read', 'create', 'update', 'delete'],
  permissions: ['read'],
  'email-settings': ['read', 'update'],
  'tax-settings': ['read', 'update'],
  'currency-settings': ['read', 'update'],
  'number-series': ['read', 'update'],
};

const { v4: uuidv4 } = require('uuid');
const permissionRecords = [];

// ============================================================
// Route-compatible aliases — these match the permission codes
// used in route middleware (requirePermission, authorize, etc.)
// ============================================================
const routeAliases = {
  // Sales route aliases
  customer: ['view', 'create', 'edit', 'delete'],
  supplier: ['view', 'create', 'edit', 'delete'],
  salesorder: ['view', 'create', 'edit', 'delete', 'approve'],
  salesinvoice: ['view', 'create', 'edit', 'delete', 'approve'],
  salesreturn: ['view', 'create', 'edit', 'delete', 'approve'],
  deliverynote: ['view', 'create', 'edit', 'delete', 'approve'],
  creditnote: ['view', 'create', 'edit', 'delete', 'post', 'cancel'],
  customerpayment: ['view', 'create', 'edit', 'delete', 'post', 'cancel'],

  // Purchases route aliases
  purchaseorder: ['view', 'create', 'approve'],
  purchaseinvoice: ['view', 'create', 'edit', 'delete', 'approve', 'cancel'],
  purchaserequest: ['view', 'create', 'edit', 'delete', 'approve'],
  purchasereturn: ['view', 'create', 'approve'],
  goodsreceipt: ['view', 'create', 'edit', 'delete', 'approve'],
  debitnote: ['view', 'create', 'edit', 'delete', 'approve'],
  supplierpayment: ['view', 'create', 'edit', 'delete', 'approve'],

  // Bank route aliases
  bankaccount: ['view', 'create', 'edit', 'delete'],
  banktransaction: ['view', 'create', 'edit', 'post', 'reverse', 'import'],
  paymentreceipt: ['view', 'create', 'edit', 'post', 'reverse'],
  paymentvoucher: ['view', 'create', 'edit', 'post', 'reverse'],
  bankreconciliation: ['view', 'create', 'edit', 'reconcile', 'reverse', 'override'],

  // Fixed Assets route aliases
  fixedasset: ['view', 'create', 'edit', 'delete', 'transfer', 'dispose', 'depreciate', 'revalue', 'audit', 'maintenance', 'insurance', 'report'],

  // Other route aliases
  quotation: ['view', 'create'],
};

// Add route aliases to permission records
for (const [module, actions] of Object.entries(routeAliases)) {
  for (const action of actions) {
    const permissionCode = `${module}.${action}`;

    const moduleName = module
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const actionName = action
      .replace(/\b\w/g, (l) => l.toUpperCase());

    permissionRecords.push({
      id: uuidv4(),
      code: permissionCode,
      name: `${moduleName} - ${actionName}`,
      module,
      group: action,
      tenant_id: tenantId,
      is_active: true,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

for (const [module, actions] of Object.entries(modules)) {
  for (const action of actions) {
    const permissionCode = `${module}.${action}`;

    // Generate human-readable name
    const moduleName = module
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const actionName = action
      .replace(/\b\w/g, (l) => l.toUpperCase());

    permissionRecords.push({
      id: uuidv4(),
      code: permissionCode,
      name: `${moduleName} - ${actionName}`,
      module,
      group: action,
      tenant_id: tenantId,
      is_active: true,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', permissionRecords, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', { tenant_id: tenantId }, {});
  },
};