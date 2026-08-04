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
  { name: 'Dashboard',     code: 'dashboard',    icon: 'Dashboard',          route: '/app/dashboard',    sortOrder: 1,  isCore: true, desc: 'Business overview and key metrics' },
  { name: 'Sales',         code: 'sales',        icon: 'ShoppingCart',       route: '/app/sales',        sortOrder: 2,  isCore: true, desc: 'Customers, quotations, orders, invoices, returns, credit notes and payments' },
  { name: 'Purchases',     code: 'purchases',    icon: 'LocalShipping',      route: '/app/purchases',    sortOrder: 3,  isCore: true, desc: 'Suppliers, purchase requests, orders, goods receipts, invoices and returns' },
  { name: 'Inventory',     code: 'inventory',    icon: 'Inventory',          route: '/app/inventory',    sortOrder: 4,  isCore: true, desc: 'Items, categories, warehouses, stock transfers, adjustments and balances' },
  { name: 'Accounting',    code: 'accounting',   icon: 'AccountBalance',     route: '/app/accounting',   sortOrder: 5,  isCore: true, desc: 'Chart of accounts, journal entries, general ledger, trial balance, P&L, balance sheet' },
  { name: 'Banks',         code: 'banks',        icon: 'AccountBalanceWallet',route: '/app/banks',       sortOrder: 6,  isCore: true, desc: 'Bank accounts, transactions, payment receipts, vouchers and reconciliation' },
  { name: 'Fixed Assets',  code: 'fixed-assets', icon: 'BusinessCenter',     route: '/app/fixed-assets', sortOrder: 7,  isCore: true, desc: 'Asset register, acquisitions, transfers, depreciation, disposal and maintenance' },
  { name: 'Report Center', code: 'reports',      icon: 'Assessment',         route: '/app/reports',      sortOrder: 8,  isCore: true, desc: 'Pre-built operational and financial reports' },
  { name: 'BI Report',     code: 'bi-report',    icon: 'BarChart',           route: '/app/bi',           sortOrder: 9,  isCore: true, desc: 'Sales, purchase, inventory and financial dashboards with analytics' },
  { name: 'Settings',      code: 'settings',     icon: 'Settings',           route: '/app/settings',     sortOrder: 10, isCore: true, desc: 'Users, roles & permissions, company profile and system configuration' },
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
      description: mod.desc || `${mod.name} module`,
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
