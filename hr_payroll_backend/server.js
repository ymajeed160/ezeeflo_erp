require('dotenv').config({ path: __dirname + '/.env' });

const app = require('./app');
const db = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('HR Database connection established successfully');

    // Sync models
    const forceSync = process.env.FORCE_SYNC === 'true';
    if (NODE_ENV === 'development' && forceSync) {
      await db.sequelize.sync({ force: true });
      logger.info('HR Database models synchronized (force mode)');
    } else {
      logger.info('HR Database sync skipped (tables already exist)');
    }

    // Ensure new models have their tables (fine-grained sync for Notification only)
    try {
      await db.Notification.sync();
      logger.info('Notification table synced');
    } catch (e) {
      logger.warn('Notification table sync skipped (may already exist):', e.message);
    }

    // Run seeders if needed
    await seedIfEmpty();

    app.listen(PORT, () => {
      logger.info(`HR & Payroll server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`API Docs: http://localhost:${PORT}/api/hr/docs`);
    });
  } catch (error) {
    logger.error('Failed to start HR server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function seedIfEmpty() {
  try {
    const departmentCount = await db.Department.count();
    if (departmentCount === 0) {
      logger.info('Seeding default HR data...');
      // Seeders will be added in future phases
      logger.info('Default HR seeding complete (no seeders to run)');
    }
  } catch (error) {
    logger.warn('HR Seeder warning (non-fatal):', error.message);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  app.close(() => {
    db.sequelize.close();
    process.exit(0);
  });
});

startServer();
