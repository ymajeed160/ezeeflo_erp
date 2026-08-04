require('dotenv').config();
const db = require('./models');

async function run() {
  try {
    // 1. Sync models to create tables
    console.log('=== Syncing Database Tables ===\n');
    await db.sequelize.sync({ force: true });
    console.log('All tables created.\n');

    // 2. Run seeders
    console.log('=== Running Seeders ===\n');

    const seederFiles = [
      './seeders/20250101000001-default-tenant',
      './seeders/20250101000002-default-permissions',
      './seeders/20250101000003-default-roles',
      './seeders/20250101000004-role-permissions',
      './seeders/20250101000005-super-admin-user',
      './seeders/20250101000006-default-accounts',
    ];

    for (const seederPath of seederFiles) {
      const seeder = require(seederPath);
      console.log(`Running: ${seederPath}`);
      await seeder.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log(`  Done.\n`);
    }

    console.log('=== All seeders executed ===');

    // Verify
    const [tenants] = await db.sequelize.query('SELECT id, name, subdomain FROM tenants');
    console.log('Tenants:', JSON.stringify(tenants, null, 2));

    const [users] = await db.sequelize.query('SELECT id, username, email, is_active FROM users');
    console.log('Users:', JSON.stringify(users, null, 2));

    const [roles] = await db.sequelize.query('SELECT id, name, code FROM roles');
    console.log('Roles:', JSON.stringify(roles, null, 2));

    const [perms] = await db.sequelize.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`Permissions count: ${perms[0].count}`);

    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error.message);
    await db.sequelize.close();
    process.exit(1);
  }
}

run();