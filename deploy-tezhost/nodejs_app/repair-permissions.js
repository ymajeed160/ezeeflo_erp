/**
 * ═══════════════════════════════════════════════════════
 *  ERP MT Suite — Permission Repair Script
 *
 *  Scans all companies (tenants) and seeds permissions
 *  + role-permission assignments if missing.
 *
 *  Run via SSH or cPanel Terminal:
 *    cd /path/to/nodejs_app
 *    node repair-permissions.js
 *
 *  Or it runs automatically at server startup (server.js).
 * ═══════════════════════════════════════════════════════
 */

const db = require('./models');
const companySeedService = require('./services/CompanySeedService');
const logger = require('./utils/logger');

async function repairAllCompanies() {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  Permission Repair — Checking all companies');
  console.log('══════════════════════════════════════════════');
  console.log('');

  try {
    await db.sequelize.authenticate();
    console.log('[✓] Database connected');
  } catch (err) {
    console.error('[✗] Database connection failed:', err.message);
    process.exit(1);
  }

  // Get all companies
  const tenants = await db.Tenant.findAll({ attributes: ['id', 'name'] });
  console.log(`[i] Found ${tenants.length} companies\n`);

  let repaired = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    // Check if this company has any permissions seeded
    const permCount = await db.Permission.count({ where: { tenantId: tenant.id } });
    const rolePermCount = await db.RolePermission.count({ where: { tenantId: tenant.id } });

    if (permCount > 0 && rolePermCount > 0) {
      console.log(`  ✓ ${tenant.name} (${tenant.id}) — ${permCount} permissions, ${rolePermCount} role-permissions — OK`);
      skipped++;
      continue;
    }

    console.log(`  ⚠ ${tenant.name} (${tenant.id}) — Missing permissions (${permCount} perms, ${rolePermCount} role-perms). Repairing...`);

    try {
      // Use the superadmin user as the "creator" for seeding
      const superAdmin = await db.User.findOne({
        where: { isSuperAdmin: true },
        order: [['createdAt', 'ASC']],
      });
      const userId = superAdmin ? superAdmin.id : null;

      await companySeedService.seedAll(tenant.id, userId);
      console.log(`  ✓ ${tenant.name} — Repaired successfully`);
      repaired++;
    } catch (err) {
      console.error(`  ✗ ${tenant.name} — Repair failed: ${err.message}`);
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log(`  Done: ${repaired} repaired, ${skipped} already OK`);
  console.log('══════════════════════════════════════════════');
  console.log('');

  process.exit(0);
}

repairAllCompanies();
