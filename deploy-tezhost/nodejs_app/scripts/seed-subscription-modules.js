/**
 * ═══════════════════════════════════════════════════════
 *  ERP MT Suite — Seed Subscription Modules
 *
 *  Populates the subscription_modules table with core
 *  ERP feature modules so they appear in the Super Admin
 *  panel for subscription plan configuration.
 *
 *  Run: node scripts/seed-subscription-modules.js
 * ═══════════════════════════════════════════════════════
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../models');

const CORE_MODULES = [
  { name: 'Dashboard',          code: 'dashboard',          icon: 'Dashboard',          route: '/app/dashboard',          sortOrder: 1,  isCore: true },
  { name: 'Sales',              code: 'sales',              icon: 'PointOfSale',        route: '/app/sales',              sortOrder: 2,  isCore: true },
  { name: 'Purchases',          code: 'purchases',          icon: 'ShoppingCart',       route: '/app/purchases',          sortOrder: 3,  isCore: true },
  { name: 'Inventory',          code: 'inventory',          icon: 'Inventory',          route: '/app/inventory',          sortOrder: 4,  isCore: true },
  { name: 'Accounting',         code: 'accounting',         icon: 'AccountBalance',     route: '/app/accounting',         sortOrder: 5,  isCore: true },
  { name: 'Banks',              code: 'banks',              icon: 'AccountBalanceWallet',route: '/app/banks',             sortOrder: 6,  isCore: true },
  { name: 'Fixed Assets',       code: 'fixed-assets',       icon: 'BusinessCenter',     route: '/app/fixed-assets',       sortOrder: 7,  isCore: true },
  { name: 'Report Center',      code: 'reports',            icon: 'Assessment',         route: '/app/reports',            sortOrder: 8,  isCore: true },
  { name: 'BI Report',          code: 'bi-report',          icon: 'BarChart',           route: '/app/bi',                 sortOrder: 9,  isCore: true },
  { name: 'Users',              code: 'users',              icon: 'People',             route: '/app/settings/users',     sortOrder: 10, isCore: true },
  { name: 'Roles & Permissions',code: 'roles',              icon: 'Security',           route: '/app/settings/roles',     sortOrder: 11, isCore: true },
  { name: 'Customers',          code: 'customers',          icon: 'Contacts',           route: '/app/customers',          sortOrder: 12, isCore: false },
  { name: 'Suppliers',          code: 'suppliers',          icon: 'LocalShipping',      route: '/app/suppliers',          sortOrder: 13, isCore: false },
  { name: 'Quotations',         code: 'quotations',         icon: 'Description',        route: '/app/quotations',         sortOrder: 14, isCore: false },
  { name: 'Delivery Notes',     code: 'delivery-notes',     icon: 'LocalShipping',      route: '/app/delivery-notes',     sortOrder: 15, isCore: false },
  { name: 'Credit Notes',       code: 'credit-notes',       icon: 'Receipt',            route: '/app/credit-notes',       sortOrder: 16, isCore: false },
  { name: 'Debit Notes',        code: 'debit-notes',        icon: 'ReceiptLong',        route: '/app/debit-notes',        sortOrder: 17, isCore: false },
  { name: 'Goods Receipt Notes',code: 'goods-receipt-notes',icon: 'Inventory',          route: '/app/goods-receipts',     sortOrder: 18, isCore: false },
  { name: 'Payment Receipts',   code: 'payment-receipts',   icon: 'Payment',            route: '/app/payment-receipts',   sortOrder: 19, isCore: false },
  { name: 'Payment Vouchers',   code: 'payment-vouchers',   icon: 'Receipt',            route: '/app/payment-vouchers',   sortOrder: 20, isCore: false },
  { name: 'Bank Reconciliation',code: 'bank-reconciliation',icon: 'CompareArrows',      route: '/app/bank-reconciliation',sortOrder: 21, isCore: false },
  { name: 'Company Profile',    code: 'company-profile',    icon: 'Business',           route: '/app/settings/company',   sortOrder: 22, isCore: false },
  { name: 'System Config',      code: 'system-config',      icon: 'Settings',           route: '/app/settings/config',    sortOrder: 23, isCore: false },
  { name: 'Tax Management',     code: 'tax-management',     icon: 'Receipt',            route: '/app/tax',                sortOrder: 24, isCore: false },
];

async function seedSubscriptionModules() {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  Seeding Subscription Modules');
  console.log('══════════════════════════════════════════════');
  console.log('');

  try {
    await db.sequelize.authenticate();
    console.log('[✓] Database connected');
  } catch (err) {
    console.error('[✗] Database connection failed:', err.message);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const mod of CORE_MODULES) {
    const existing = await db.SubscriptionModule.findOne({ where: { moduleCode: mod.code } });
    if (existing) {
      console.log(`  ∼ ${mod.name} (${mod.code}) — already exists`);
      skipped++;
      continue;
    }

    await db.SubscriptionModule.create({
      id: uuidv4(),
      moduleName: mod.name,
      moduleCode: mod.code,
      description: `${mod.name} module`,
      icon: mod.icon,
      route: mod.route,
      status: 'enabled',
      isCore: mod.isCore,
      sortOrder: mod.sortOrder,
    });

    console.log(`  ✓ ${mod.name} (${mod.code}) — created`);
    created++;
  }

  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log(`  Done: ${created} created, ${skipped} skipped`);
  console.log('══════════════════════════════════════════════');
  console.log('');

  process.exit(0);
}

seedSubscriptionModules();
