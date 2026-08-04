/**
 * Add missing acquisition_id column to assets table.
 * Run: node scripts/fix-assets-column.js
 */
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function fix() {
  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host, port: dbConfig.port, dialect: dbConfig.dialect, logging: console.log,
  });
  await sequelize.authenticate();
  
  // Check if column exists
  const [cols] = await sequelize.query("SHOW COLUMNS FROM assets LIKE 'acquisition_id'");
  if (cols.length === 0) {
    await sequelize.query("ALTER TABLE assets ADD COLUMN acquisition_id CHAR(36) BINARY NULL AFTER category_id, ADD INDEX idx_assets_acquisition (acquisition_id)");
    console.log('✓ Added acquisition_id column to assets table');
  } else {
    console.log('✓ acquisition_id column already exists');
  }

  // Also add FK constraint if needed (for data integrity)
  try {
    await sequelize.query("ALTER TABLE assets ADD CONSTRAINT fk_assets_acquisition FOREIGN KEY (acquisition_id) REFERENCES asset_acquisitions(id) ON DELETE SET NULL ON UPDATE CASCADE");
    console.log('✓ Added foreign key constraint');
  } catch (e) {
    if (e.message.includes('Duplicate')) console.log('✓ FK already exists');
    else console.log('Note: FK may already exist or asset_acquisitions table not ready:', e.message);
  }

  await sequelize.close();
  process.exit(0);
}

fix().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
