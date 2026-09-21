const mysql = require('mysql2/promise');

const PERMISSIONS = [
  { code: 'cpv.view', name: 'View CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.create', name: 'Create CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.edit', name: 'Edit CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.delete', name: 'Delete CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.post', name: 'Post CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.reverse', name: 'Reverse CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.cancel', name: 'Cancel CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.print', name: 'Print CPV', module: 'Purchases', group: 'CPV' },
  { code: 'cpv.export', name: 'Export CPV', module: 'Purchases', group: 'CPV' },
];

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'ezeefloc_proderp', password: 'Memits@396', database: 'erp_mt_suite',
  });

  // Get all tenants
  const [tenants] = await conn.query('SELECT id FROM tenants');

  for (const tenant of tenants) {
    for (const perm of PERMISSIONS) {
      const [existing] = await conn.query(
        'SELECT id FROM permissions WHERE code = ? AND tenant_id = ?', [perm.code, tenant.id]
      );
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO permissions (id, tenant_id, code, name, module, `group`, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, 1, NOW(), NOW())',
          [tenant.id, perm.code, perm.name, perm.module, perm.group]
        );
        console.log(`Added: ${perm.code} for tenant ${tenant.id}`);
      }
    }

    // Assign CPV permissions to Super Admin role
    const [superAdminRole] = await conn.query(
      'SELECT id FROM roles WHERE code = ? AND tenant_id = ?', ['super_admin', tenant.id]
    );
    if (superAdminRole.length > 0) {
      for (const perm of PERMISSIONS) {
        const [permRow] = await conn.query(
          'SELECT id FROM permissions WHERE code = ? AND tenant_id = ?', [perm.code, tenant.id]
        );
        if (permRow.length > 0) {
          await conn.query(
            'INSERT IGNORE INTO role_permissions (id, role_id, permission_id, tenant_id, created_at, updated_at) VALUES (UUID(), ?, ?, ?, NOW(), NOW())',
            [superAdminRole[0].id, permRow[0].id, tenant.id]
          );
        }
      }
      console.log(`CPV permissions assigned to Super Admin for tenant ${tenant.id}`);
    }
  }

  await conn.end();
  console.log('Done seeding CPV permissions');
})().catch(err => { console.error(err); process.exit(1); });
