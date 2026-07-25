require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./app');
const db = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function seedIfEmpty() {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';

    // Check if default tenant exists
    const [tenantRows] = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM tenants WHERE id = ?',
      { replacements: [tenantId] }
    );
    const tenantExists = tenantRows[0].count > 0;

    if (!tenantExists) {
      logger.info('Running essential seeders...');

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
        await seeder.up(db.sequelize.getQueryInterface(), db.Sequelize);
      }

      logger.info('All essential seeders executed successfully');
    } else {
      // Tenant exists — check if accounts need seeding
      const [accountRows] = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM accounts WHERE tenant_id = ?',
        { replacements: [tenantId] }
      );
      const accountsExist = accountRows[0].count > 0;

      if (!accountsExist) {
        logger.info('Seeding default accounts...');
        const accountsSeeder = require('./seeders/20250101000006-default-accounts');
        await accountsSeeder.up(db.sequelize.getQueryInterface(), db.Sequelize);
        logger.info('Default accounts seeded successfully');
      }

      // Migrate existing users to UserTenant if they don't have records
      const [missingUserTenant] = await db.sequelize.query(`
        SELECT u.id as userId, u.tenant_id as tenantId
        FROM users u
        LEFT JOIN user_tenants ut ON ut.user_id = u.id AND ut.tenant_id = u.tenant_id
        WHERE ut.id IS NULL
      `);
      if (missingUserTenant && missingUserTenant.length > 0) {
        logger.info(`Migrating ${missingUserTenant.length} users to UserTenant...`);
        for (const row of missingUserTenant) {
          await db.sequelize.query(
            `INSERT INTO user_tenants (id, user_id, tenant_id, is_default, created_at, updated_at)
             VALUES (UUID(), ?, ?, true, NOW(), NOW())
             ON DUPLICATE KEY UPDATE is_default = true`,
            { replacements: [row.userId, row.tenantId] }
          );
        }
        logger.info('UserTenant migration complete');
      }
    }
  } catch (error) {
    logger.warn('Seeder warning (non-fatal):', error.message);
  }
}

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models
    const forceSync = process.env.FORCE_SYNC === 'true';
    if (NODE_ENV === 'development') {
      // Use sync without alter to avoid duplicate index accumulation
      // FORCE_SYNC=true in .env to recreate all tables
      await db.sequelize.sync({ force: forceSync });
      logger.info(`Database models synchronized (${forceSync ? 'force' : 'no-alter'} mode)`);
    }

    // Run essential seeders if data doesn't exist
    await seedIfEmpty();

    // Seed subscription modules if empty
    try {
      const moduleCount = await db.SubscriptionModule.count();
      if (moduleCount === 0) {
        logger.info('Seeding subscription modules...');
        const { v4: uuidv4 } = require('uuid');
        const modules = [
          { name: 'Dashboard', code: 'dashboard', sortOrder: 1, isCore: true },
          { name: 'Sales', code: 'sales', sortOrder: 2, isCore: true },
          { name: 'Purchases', code: 'purchases', sortOrder: 3, isCore: true },
          { name: 'Inventory', code: 'inventory', sortOrder: 4, isCore: true },
          { name: 'Accounting', code: 'accounting', sortOrder: 5, isCore: true },
          { name: 'Banks', code: 'banks', sortOrder: 6, isCore: true },
          { name: 'Fixed Assets', code: 'fixed-assets', sortOrder: 7, isCore: true },
          { name: 'Report Center', code: 'reports', sortOrder: 8, isCore: true },
          { name: 'BI Report', code: 'bi-report', sortOrder: 9, isCore: true },
          { name: 'Settings', code: 'settings', sortOrder: 10, isCore: true },
          { name: 'Point of Sale', code: 'pos', sortOrder: 11, isCore: false, route: '/app/pos' },
        ];
        for (const mod of modules) {
          const existing = await db.SubscriptionModule.findOne({ where: { moduleCode: mod.code } });
          if (!existing) {
            await db.SubscriptionModule.create({
              id: uuidv4(), moduleName: mod.name, moduleCode: mod.code,
              description: `${mod.name} module`,
              status: 'enabled', isCore: mod.isCore || false, sortOrder: mod.sortOrder,
              route: mod.route || `/app/${mod.code}`,
            });
          }
        }
        logger.info(`Seeded ${modules.length} subscription modules`);
      }
    } catch (seedErr) {
      logger.warn('Subscription module seeding skipped:', seedErr.message);
    }

    // Repair permissions for any companies that are missing them
    try {
      const { v4: uuidv4 } = require('uuid');
      const companySeedService = require('./services/CompanySeedService');
      const tenants = await db.sequelize.query(
        'SELECT id, name FROM tenants', { type: db.sequelize.QueryTypes.SELECT }
      );
      for (const tenant of tenants) {
        const permCount = await db.Permission.count({ where: { tenantId: tenant.id } });
        const rolePermCount = await db.RolePermission.count({ where: { tenantId: tenant.id } });
        if (permCount === 0 || rolePermCount === 0) {
          logger.info(`Repairing permissions for company: ${tenant.name}`);
          const superAdminUser = await db.User.findOne({
            where: { isSuperAdmin: true },
            order: [['createdAt', 'ASC']],
          });
          const userId = superAdminUser?.id || null;
          await companySeedService.seedAll(tenant.id, userId);
          // Assign Super Admin role to the superadmin user for this company
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
                  id: uuidv4(), userId, roleId: superAdminRole.id, tenantId: tenant.id,
                });
              }
            }
          }
          logger.info(`Permissions repaired for company: ${tenant.name}`);
        }
      }
    } catch (repairErr) {
      logger.warn('Permission repair skipped:', repairErr.message);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`API Base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        db.sequelize.close().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();// timestamp 14:18:18