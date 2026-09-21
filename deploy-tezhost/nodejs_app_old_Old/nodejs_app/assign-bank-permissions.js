const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');
const db = require('./models');

async function run() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const superAdminRoleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userId = '00000000-0000-0000-0000-000000000001';

  const rows = await db.sequelize.query(
    `SELECT p.id, p.code FROM permissions p
     WHERE p.tenant_id = :tenantId
       AND (p.code LIKE 'bankaccount.%' OR p.code LIKE 'banktransaction.%'
            OR p.code LIKE 'paymentreceipt.%' OR p.code LIKE 'paymentvoucher.%'
            OR p.code LIKE 'bankreconciliation.%')
       AND p.id NOT IN (
         SELECT permission_id FROM role_permissions
         WHERE role_id = :roleId AND tenant_id = :tenantId
       )`,
    { replacements: { tenantId, roleId: superAdminRoleId }, type: QueryTypes.SELECT }
  );

  if (rows.length === 0) {
    console.log('All bank permissions already assigned to Super Admin role.');
    process.exit(0);
  }

  const records = rows.map(p => [
    uuidv4(), superAdminRoleId, p.id, tenantId, userId, userId, new Date(), new Date()
  ]);

  await db.sequelize.query(
    'INSERT INTO role_permissions (id, role_id, permission_id, tenant_id, created_by, updated_by, created_at, updated_at) VALUES ?',
    { replacements: [records] }
  );

  console.log('Assigned ' + rows.length + ' new bank permissions to Super Admin role:');
  rows.forEach(p => console.log('  - ' + p.code));
}

run().catch(e => { console.error(e.message); process.exit(1); });
