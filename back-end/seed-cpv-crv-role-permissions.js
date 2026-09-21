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
  { code: 'crv.view', name: 'View CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.create', name: 'Create CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.edit', name: 'Edit CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.delete', name: 'Delete CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.post', name: 'Post CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.reverse', name: 'Reverse CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.cancel', name: 'Cancel CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.print', name: 'Print CRV', module: 'Sales', group: 'CRV' },
  { code: 'crv.export', name: 'Export CRV', module: 'Sales', group: 'CRV' },
];

const ROLE_CODES = ['super_admin', 'admin'];

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'ezeefloc_proderp', password: 'Memits@396', database: 'erp_mt_suite',
  });

  const [tenants] = await conn.query('SELECT id FROM tenants');

  for (const tenant of tenants) {
    // Ensure permissions exist
    for (const perm of PERMISSIONS) {
      const [existing] = await conn.query(
        'SELECT id FROM permissions WHERE code = ? AND tenant_id = ?', [perm.code, tenant.id]
      );
      if (existing.length === 0) {
        await conn.query(
          'INSERT INTO permissions (id, tenant_id, code, name, module, `group`, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, ?, ?, ?, 1, NOW(), NOW())',
          [tenant.id, perm.code, perm.name, perm.module, perm.group]
        );
        console.log(`Added permission: ${perm.code} for tenant ${tenant.id}`);
      }
    }

    // Assign to Super Admin AND Admin roles
    for (const roleCode of ROLE_CODES) {
      const [roles] = await conn.query(
        'SELECT id FROM roles WHERE code = ? AND tenant_id = ?', [roleCode, tenant.id]
      );
      for (const role of roles) {
        let assigned = 0;
        for (const perm of PERMISSIONS) {
          const [permRows] = await conn.query(
            'SELECT id FROM permissions WHERE code = ? AND tenant_id = ?', [perm.code, tenant.id]
          );
          if (permRows.length === 0) continue;
          const [res] = await conn.query(
            'INSERT IGNORE INTO role_permissions (id, role_id, permission_id, tenant_id, created_at, updated_at) VALUES (UUID(), ?, ?, ?, NOW(), NOW())',
            [role.id, permRows[0].id, tenant.id]
          );
          if (res.affectedRows > 0) assigned++;
        }
        console.log(`Assigned ${assigned} CPV/CRV permissions to ${roleCode} (${role.id}) for tenant ${tenant.id}`);
      }
    }
  }

  await conn.end();
  console.log('Done seeding CPV/CRV permissions for Super Admin + Admin roles.');
})().catch(err => { console.error(err); process.exit(1); });
