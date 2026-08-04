require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize } = require('sequelize');
const fs = require('fs');

const seq = new Sequelize('erp_mt_suite', 'root', 'Memits@396', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

async function run() {
  await seq.authenticate();
  console.log('Connected to local DB');
  const qi = seq.getQueryInterface();

  // Delete old data in order
  await qi.bulkDelete('user_roles', {});
  await qi.bulkDelete('role_permissions', {});
  await qi.bulkDelete('user_tenants', {});
  await qi.bulkDelete('roles', {});
  await qi.bulkDelete('permissions', {});
  console.log('Cleared old data');

  // Seed fresh
  const permSeeder = require('../seeders/20250101000002-default-permissions');
  const roleSeeder = require('../seeders/20250101000003-default-roles');
  const rpSeeder = require('../seeders/20250101000004-role-permissions');
  const userSeeder = require('../seeders/20250101000005-super-admin-user');

  await permSeeder.up(qi, Sequelize);
  console.log('Permissions seeded');

  await roleSeeder.up(qi, Sequelize);
  console.log('Roles seeded');

  await rpSeeder.up(qi, Sequelize);
  console.log('Role-permissions seeded');

  // Skip user seeding - user already exists from backup
  // But we need to assign the user to the super_admin role
  const [adminRole] = await seq.query("SELECT id FROM roles WHERE code = 'super_admin' LIMIT 1");
  const [adminUser] = await seq.query("SELECT id FROM users WHERE email = 'admin@erp.com' LIMIT 1");
  if (adminUser.length > 0 && adminRole.length > 0) {
    await seq.query("INSERT IGNORE INTO user_roles (id, user_id, role_id, tenant_id, created_at, updated_at) VALUES (UUID(), '" + adminUser[0].id + "', '" + adminRole[0].id + "', '11111111-1111-1111-1111-111111111111', NOW(), NOW())");
    console.log('Super admin assigned to super_admin role');
  }

  // Now export these 5 tables as SQL INSERT statements
  const tables = ['permissions', 'roles', 'role_permissions', 'user_roles'];

  let sql = '-- ============================================================\n';
  sql += '-- ERP MT Suite - Permission Fix Script\n';
  sql += '-- Generated: ' + new Date().toISOString() + '\n';
  sql += '-- Run this in phpMyAdmin on your tezhost database\n';
  sql += '-- ============================================================\n\n';

  // Start transaction
  sql += 'START TRANSACTION;\n\n';

  for (const table of tables) {
    const [rows] = await seq.query('SELECT * FROM `' + table + '`');
    if (rows.length === 0) continue;

    // For role_permissions & user_roles, delete old ones first
    if (table === 'role_permissions') {
      sql += '-- Delete existing role-permission mappings\n';
      sql += 'DELETE FROM `role_permissions`;\n\n';
    }
    if (table === 'user_roles') {
      sql += '-- Delete existing user-role mappings\n';
      sql += 'DELETE FROM `user_roles`;\n\n';
    }
    if (table === 'roles') {
      sql += '-- Delete existing roles\n';
      sql += 'DELETE FROM `roles`;\n\n';
    }
    if (table === 'permissions') {
      sql += '-- Delete existing permissions\n';
      sql += 'DELETE FROM `permissions`;\n\n';
    }

    sql += '-- ' + table + ' (' + rows.length + ' records)\n';
    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => '`' + c + '`').join(', ');
    sql += 'INSERT INTO `' + table + '` (' + colNames + ') VALUES\n';

    const valueStrings = rows.map(row => {
      return '(' + columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (Buffer.isBuffer(val)) return "'" + val.toString('hex') + "'";
        if (typeof val === 'number') return val.toString();
        return "'" + String(val).replace(/'/g, "\\'") + "'";
      }).join(', ') + ')';
    });
    sql += valueStrings.join(',\n') + ';\n\n';
  }

  sql += 'COMMIT;\n';
  sql += '\n-- Done! All permissions, roles, and assignments refreshed.\n';

  const outPath = 'C:/Yasir/ERPMultiTenant/ERPMTSuite/database/fix_permissions.sql';
  fs.writeFileSync(outPath, sql);
  console.log('\nSQL script written to: ' + outPath);
  console.log('File size: ' + (sql.length / 1024).toFixed(1) + ' KB');

  await seq.close();
}

run().catch(e => console.error('Error:', e));
