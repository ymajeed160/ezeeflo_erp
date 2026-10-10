'use strict';
/**
 * One-off helper: apply ONLY the variant migration and record it in
 * SequelizeMeta. The local dev DB is sync-managed, so most historical
 * migrations are "down" in SequelizeMeta even though their tables exist.
 */
require('dotenv').config({ path: __dirname + '/.env' });
const Sequelize = require('sequelize');
const sequelize = require('./config/database');
const migration = require('./migrations/20261010000001-create-item-attributes-variants');

(async () => {
  const queryInterface = sequelize.getQueryInterface();
  await migration.up(queryInterface, Sequelize);
  await sequelize.query(
    `INSERT INTO SequelizeMeta (name) VALUES ('20261010000001-create-item-attributes-variants.js')
     ON DUPLICATE KEY UPDATE name = name`
  );
  console.log('Variant migration applied and recorded in SequelizeMeta.');
  process.exit(0);
})().catch((e) => {
  console.error('Variant migration failed:', e.message);
  process.exit(1);
});
