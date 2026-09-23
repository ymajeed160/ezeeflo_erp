require('dotenv').config();
const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const SUPER_ADMIN_USER = '00000000-0000-0000-0000-000000000001';

const titleCase = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

// (module, actions) — route aliases and menu modules
const permissionDefs = [
  ['sellingresource', ['view', 'create', 'edit', 'delete']],
  ['selling-resources', ['view', 'create', 'edit', 'delete', 'report']],
];

(async () => {
  await sequelize.authenticate();

  const tenants = await sequelize.query(`SELECT id FROM tenants`, { type: QueryTypes.SELECT });
  const roleRows = await sequelize.query(
    `SELECT id, name, tenant_id FROM roles WHERE LOWER(name) IN ('super admin','admin')`,
    { type: QueryTypes.SELECT }
  );

  let inserted = 0;
  let granted = 0;

  for (const t of tenants) {
    for (const [mod, actions] of permissionDefs) {
      for (const action of actions) {
        const code = `${mod}.${action}`;
        const existing = await sequelize.query(
          `SELECT id FROM permissions WHERE tenant_id = :t AND code = :code`,
          { replacements: { t: t.id, code }, type: QueryTypes.SELECT }
        );
        if (existing.length === 0) {
          await sequelize.query(
            `INSERT INTO permissions (id, code, name, module, \`group\`, tenant_id, is_active, created_by, updated_by, created_at, updated_at)
             VALUES (:id, :code, :name, :module, :grp, :t, 1, :by, :by, NOW(), NOW())`,
            {
              replacements: {
                id: uuidv4(),
                code,
                name: `${titleCase(mod)} - ${titleCase(action)}`,
                module: mod,
                grp: action,
                t: t.id,
                by: SUPER_ADMIN_USER,
              },
            }
          );
          inserted += 1;
        }
      }
    }
  }

  // Grant new permissions to Super Admin / Admin roles for each tenant
  for (const t of tenants) {
    const permIds = await sequelize.query(
      `SELECT id FROM permissions WHERE tenant_id = :t AND code LIKE 'selling%'`,
      { replacements: { t: t.id }, type: QueryTypes.SELECT }
    );
    const roles = roleRows.filter((r) => r.tenant_id === t.id);
    for (const role of roles) {
      for (const p of permIds) {
        const existing = await sequelize.query(
          `SELECT id FROM role_permissions WHERE tenant_id = :t AND role_id = :rid AND permission_id = :pid`,
          { replacements: { t: t.id, rid: role.id, pid: p.id }, type: QueryTypes.SELECT }
        );
        if (existing.length === 0) {
          await sequelize.query(
            `INSERT INTO role_permissions (id, role_id, permission_id, tenant_id, created_by, updated_by, created_at, updated_at)
             VALUES (:id, :rid, :pid, :t, :by, :by, NOW(), NOW())`,
            {
              replacements: {
                id: uuidv4(), rid: role.id, pid: p.id, t: t.id, by: SUPER_ADMIN_USER,
              },
            }
          );
          granted += 1;
        }
      }
    }
  }

  console.log(`Inserted ${inserted} permissions, granted ${granted} role_permissions`);
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
