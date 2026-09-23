require('dotenv').config();
const { sequelize, Tenant, Role, Permission, RolePermission } = require('./models');
const { QueryTypes } = require('sequelize');

(async () => {
  await sequelize.authenticate();

  const roles = await sequelize.query(
    `SELECT id, name, tenant_id FROM roles ORDER BY tenant_id, name`,
    { type: QueryTypes.SELECT }
  );
  console.log('ROLES:');
  roles.forEach((r) => console.log(`  ${r.tenant_id} | ${r.name} | ${r.id}`));

  const existing = await sequelize.query(
    `SELECT code, tenant_id FROM permissions WHERE code LIKE 'selling%'`,
    { type: QueryTypes.SELECT }
  );
  console.log('\nEXISTING selling* permissions:', existing.length);
  existing.forEach((p) => console.log(`  ${p.tenant_id} | ${p.code}`));

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
