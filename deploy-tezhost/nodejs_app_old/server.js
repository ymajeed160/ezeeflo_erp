/**
 * ═══════════════════════════════════════════════════════
 *  ERP MT Suite — Unified Node.js Server
 *  For TezHost Deluxe Pro (cPanel Node.js Selector)
 *
 *  ✅ Serves React frontend (from ./build/)
 *  ✅ Serves Express API backend (from ./app.js)
 *  ✅ Single upload folder — set as Node.js App Root
 * ═══════════════════════════════════════════════════════
 *
 *  📥 1. Upload this entire folder to your server
 *  ⚙️ 2. In cPanel → Setup Node.js App:
 *         App Root:    /path/to/this/folder
 *         Startup:     server.js
 *         Env vars:    Add your DB credentials & secrets
 *  🚀 3. Click Create → Run npm install → Start
 *
 *  Your app will be live at: https://yourdomain.com
 *  API at:                   https://yourdomain.com/api
 * ═══════════════════════════════════════════════════════
 */

require('dotenv').config({ path: __dirname + '/.env' });
const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const BUILD_PATH = path.resolve(__dirname, './build');
const NODE_ENV = process.env.NODE_ENV || 'production';

// ═══════════════════════════════════════════════════════
//  1. BACKEND API — Import full Express app from app.js
//     app.js handles: helmet, CORS, rate limiting,
//     compression, logging, all /api/* routes, auth,
//     error handling, and DB sync
// ═══════════════════════════════════════════════════════

const backendApp = require('./app');
app.use(backendApp);

// ═══════════════════════════════════════════════════════
//  2. FRONTEND — Serve React SPA build
//     Served for all non-API routes with SPA fallback
// ═══════════════════════════════════════════════════════

if (fs.existsSync(BUILD_PATH)) {
  // Serve static files with long-term caching
  app.use(express.static(BUILD_PATH, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // SPA fallback — any route that isn't caught by the backend
  // serves index.html so React Router handles client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(BUILD_PATH, 'index.html'));
    }
  });

  console.log('[✓] Frontend build loaded: ' + BUILD_PATH);
} else {
  console.warn('[!] Frontend build NOT found at: ' + BUILD_PATH);
  console.warn('[!] Upload the React build files to the build/ folder or run npm run build');
}

// ═══════════════════════════════════════════════════════
//  3. START SERVER
// ═══════════════════════════════════════════════════════

// Seed subscription modules if table is empty
// (runs in background, doesn't block startup)
async function seedSubscriptionModules() {
  try {
    const db = require('./models');
    const { v4: uuidv4 } = require('uuid');
    const count = await db.SubscriptionModule.count();
    if (count > 0) return;

    console.log('[!] Seeding subscription modules...');
    const modules = [
      { name: 'Dashboard', code: 'dashboard', icon: 'Dashboard', route: '/app/dashboard', sortOrder: 1, isCore: true, desc: 'Business overview and key metrics' },
      { name: 'Sales', code: 'sales', icon: 'ShoppingCart', route: '/app/sales', sortOrder: 2, isCore: true, desc: 'Customers, quotations, orders, invoices, returns, credit notes and payments' },
      { name: 'Purchases', code: 'purchases', icon: 'LocalShipping', route: '/app/purchases', sortOrder: 3, isCore: true, desc: 'Suppliers, purchase requests, orders, goods receipts, invoices and returns' },
      { name: 'Inventory', code: 'inventory', icon: 'Inventory', route: '/app/inventory', sortOrder: 4, isCore: true, desc: 'Items, categories, warehouses, stock transfers, adjustments and balances' },
      { name: 'Accounting', code: 'accounting', icon: 'AccountBalance', route: '/app/accounting', sortOrder: 5, isCore: true, desc: 'Chart of accounts, journal entries, general ledger, trial balance, P&L, balance sheet' },
      { name: 'Banks', code: 'banks', icon: 'AccountBalanceWallet', route: '/app/banks', sortOrder: 6, isCore: true, desc: 'Bank accounts, transactions, payment receipts, vouchers and reconciliation' },
      { name: 'Fixed Assets', code: 'fixed-assets', icon: 'BusinessCenter', route: '/app/fixed-assets', sortOrder: 7, isCore: true, desc: 'Asset register, acquisitions, transfers, depreciation, disposal and maintenance' },
      { name: 'Report Center', code: 'reports', icon: 'Assessment', route: '/app/reports', sortOrder: 8, isCore: true, desc: 'Pre-built operational and financial reports' },
      { name: 'BI Report', code: 'bi-report', icon: 'BarChart', route: '/app/bi', sortOrder: 9, isCore: true, desc: 'Sales, purchase, inventory and financial dashboards with analytics' },
      { name: 'Settings', code: 'settings', icon: 'Settings', route: '/app/settings', sortOrder: 10, isCore: true, desc: 'Users, roles & permissions, company profile and system configuration' },
    ];
    for (const mod of modules) {
      const existing = await db.SubscriptionModule.findOne({ where: { moduleCode: mod.code } });
      if (!existing) {
        await db.SubscriptionModule.create({
          id: uuidv4(), moduleName: mod.name, moduleCode: mod.code,
          description: `${mod.name} module`, icon: mod.icon, route: mod.route,
          status: 'enabled', isCore: mod.isCore || false, sortOrder: mod.sortOrder,
        });
      }
    }
    console.log(`[✓] Seeded ${modules.length} subscription modules`);
  } catch (err) {
    console.warn('[!] Subscription module seeding skipped:', err.message);
  }
}

// Repair permissions for any companies that are missing them
// (runs in background, doesn't block startup)
async function repairPermissions() {
  try {
    const db = require('./models');
    const { v4: uuidv4 } = require('uuid');
    const companySeedService = require('./services/CompanySeedService');

    const tenants = await db.Tenant.findAll({ attributes: ['id', 'name'] });
    for (const tenant of tenants) {
      const permCount = await db.Permission.count({ where: { tenantId: tenant.id } });
      const rolePermCount = await db.RolePermission.count({ where: { tenantId: tenant.id } });

      if (permCount === 0 || rolePermCount === 0) {
        console.log(`[!] Repairing permissions for: ${tenant.name}`);
        const superAdminUser = await db.User.findOne({
          where: { isSuperAdmin: true },
          order: [['createdAt', 'ASC']],
        });
        const userId = superAdminUser?.id || null;
        await companySeedService.seedAll(tenant.id, userId);

        // Also assign the Super Admin role to the superadmin user for this company
        if (userId) {
          const superAdminRole = await db.Role.findOne({
            where: { code: 'super_admin', tenantId: tenant.id },
          });
          if (superAdminRole) {
            const existing = await db.UserRole.findOne({
              where: { userId, roleId: superAdminRole.id, tenantId: tenant.id },
            });
            if (!existing) {
              await db.UserRole.create({
                id: uuidv4(),
                userId,
                roleId: superAdminRole.id,
                tenantId: tenant.id,
              });
              console.log(`  → Super Admin role assigned to superadmin user for: ${tenant.name}`);
            }
          }
        }

        console.log(`[✓] Permissions repaired for: ${tenant.name}`);
      }
    }
  } catch (err) {
    console.warn('[!] Permission repair skipped:', err.message);
  }
}

const server = app.listen(PORT, async () => {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  ERP MT Suite — Unified Server');
  console.log('  TezHost Deluxe Pro (cPanel Node.js)');
  console.log('══════════════════════════════════════════════');
  console.log('  URL       : http://localhost:' + PORT);
  console.log('  Frontend  : http://localhost:' + PORT);
  console.log('  API       : http://localhost:' + PORT + '/api');
  console.log('  Health    : http://localhost:' + PORT + '/api/health');
  console.log('  Docs      : http://localhost:' + PORT + '/api/docs');
  console.log('  Env       : ' + NODE_ENV);
  console.log('  Node      : ' + process.version);
  console.log('══════════════════════════════════════════════');
  console.log('');

  // Run background tasks (non-blocking)
  seedSubscriptionModules().then(() => {
    repairPermissions().then(() => {
      console.log('[✓] Startup checks complete');
    });
  });
});

// Graceful shutdown
process.on('SIGINT', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); });

module.exports = app;
