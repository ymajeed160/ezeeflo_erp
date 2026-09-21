require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./app');
const db = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function seedIfEmpty() {
  try {
    // Check if super admin user exists
    const [userRows] = await db.sequelize.query(
      "SELECT COUNT(*) as count FROM users WHERE is_super_admin = 1"
    );
    const superAdminExists = userRows[0].count > 0;

    if (!superAdminExists) {
      logger.info('Running essential seeders...');

      const seederFiles = [
        './seeders/20250101000001-default-permissions',
        './seeders/20250101000002-default-roles',
        './seeders/20250101000003-super-admin-user',
        './seeders/20250101000004-default-plans',
        './seeders/20250101000005-default-modules',
        './seeders/20250101000006-default-membership-tiers',
      ];

      for (const seederPath of seederFiles) {
        try {
          const seeder = require(seederPath);
          await seeder.up(db.sequelize.getQueryInterface(), db.Sequelize);
          logger.info(`Seeder executed: ${seederPath}`);
        } catch (err) {
          logger.warn(`Seeder ${seederPath} skipped: ${err.message}`);
        }
      }

      logger.info('Essential seeders executed successfully');
    } else {
      logger.info('Super admin already exists, skipping seeders');
    }
  } catch (error) {
    logger.error('Seeder check failed:', { error: error.message });
  }
}

async function start() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (development only)
    if (NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }

    // Run seeders
    await seedIfEmpty();

    // Start server
    app.listen(PORT, () => {
      logger.info(`EzeeFlo Loyalty API running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await db.sequelize.close();
  process.exit(0);
});

start();
