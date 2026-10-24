'use strict';
/**
 * Apply the FIFO cost-layer migration directly (the dev DB is not managed by
 * sequelize-cli's SequelizeMeta, so this runs only the new migration).
 */
require('dotenv').config();
const { sequelize, Sequelize } = require('./models');
const migration = require('./migrations/20261024000001-create-inventory-cost-layers');

(async () => {
  const qi = sequelize.getQueryInterface();
  await migration.up(qi, Sequelize);
  console.log('FIFO migration applied successfully.');
  await sequelize.close();
  process.exit(0);
})().catch(async (e) => {
  console.error('Migration failed:', e.message);
  await sequelize.close();
  process.exit(1);
});
