require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize } = require('sequelize');

const seq = new Sequelize(
  process.env.DB_NAME || 'ezeefloc_erp',
  process.env.DB_USER || 'ezeefloc_erp',
  process.env.DB_PASSWORD || 'Memits@396',
  {
    host: process.env.DB_HOST || 'c28.eelserver.com',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function check() {
  try {
    await seq.authenticate();
    console.log('=== Database Connected ===\n');

    const [rp] = await seq.query('SELECT COUNT(*) as cnt FROM role_permissions');
    console.log('role_permissions count:', rp[0].cnt);

    const [p] = await seq.query('SELECT COUNT(*) as cnt FROM permissions');
    console.log('permissions count:', p[0].cnt);

    const [ur] = await seq.query('SELECT COUNT(*) as cnt FROM user_roles');
    console.log('user_roles count:', ur[0].cnt);

    const [r] = await seq.query('SELECT COUNT(*) as cnt FROM roles');
    console.log('roles count:', r[0].cnt);

    const [roles] = await seq.query('SELECT id, code, name FROM roles');
    console.log('\nRoles:', JSON.stringify(roles, null, 2));

    const [users] = await seq.query("SELECT id, email FROM users LIMIT 5");
    console.log('\nUsers:', JSON.stringify(users, null, 2));

    const [userRoles] = await seq.query("SELECT ur.*, r.code as role_code FROM user_roles ur JOIN roles r ON r.id = ur.role_id");
    console.log('\nUser-Role assignments:', JSON.stringify(userRoles, null, 2));

    const [perms] = await seq.query("SELECT code FROM permissions ORDER BY code LIMIT 10");
    console.log('\nSample permissions:', JSON.stringify(perms, null, 2));

    const [rolePerms] = await seq.query("SELECT r.code as role, p.code as permission FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id LIMIT 15");
    console.log('\nRole-Permission assignments:', JSON.stringify(rolePerms, null, 2));

    await seq.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
