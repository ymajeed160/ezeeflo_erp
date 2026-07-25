/**
 * Script to seed Fixed Assets permissions into the database.
 * Run: node seed-fixedasset-permissions.js
 */
const { v4: uuidv4 } = require('uuid');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.json');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
  }
);

const tenantId = '11111111-1111-1111-1111-111111111111';
const superAdminRoleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const PERMISSIONS = [
  // Fixed asset route permissions (used by requirePermission middleware)
  { code: 'fixedasset.view', name: 'Fixed Assets View', module: 'fixedasset', group: 'Fixed Assets', description: 'View fixed assets' },
  { code: 'fixedasset.create', name: 'Fixed Assets Create', module: 'fixedasset', group: 'Fixed Assets', description: 'Create fixed assets' },
  { code: 'fixedasset.edit', name: 'Fixed Assets Edit', module: 'fixedasset', group: 'Fixed Assets', description: 'Edit fixed assets' },
  { code: 'fixedasset.delete', name: 'Fixed Assets Delete', module: 'fixedasset', group: 'Fixed Assets', description: 'Delete fixed assets' },
  { code: 'fixedasset.transfer', name: 'Fixed Assets Transfer', module: 'fixedasset', group: 'Fixed Assets', description: 'Transfer fixed assets' },
  { code: 'fixedasset.dispose', name: 'Fixed Assets Dispose', module: 'fixedasset', group: 'Fixed Assets', description: 'Dispose fixed assets' },
  { code: 'fixedasset.depreciate', name: 'Fixed Assets Depreciate', module: 'fixedasset', group: 'Fixed Assets', description: 'Process depreciation' },
  { code: 'fixedasset.revalue', name: 'Fixed Assets Revalue', module: 'fixedasset', group: 'Fixed Assets', description: 'Revalue fixed assets' },
  { code: 'fixedasset.audit', name: 'Fixed Assets Audit', module: 'fixedasset', group: 'Fixed Assets', description: 'Audit fixed assets' },
  { code: 'fixedasset.maintenance', name: 'Fixed Assets Maintenance', module: 'fixedasset', group: 'Fixed Assets', description: 'Manage maintenance' },
  { code: 'fixedasset.insurance', name: 'Fixed Assets Insurance', module: 'fixedasset', group: 'Fixed Assets', description: 'Manage insurance' },
  { code: 'fixedasset.report', name: 'Fixed Assets Report', module: 'fixedasset', group: 'Fixed Assets', description: 'View fixed asset reports' },
  // Module-level permissions for UI visibility
  { code: 'fixed-assets.read', name: 'Fixed Assets Module Read', module: 'fixed-assets', group: 'Fixed Assets', description: 'Access fixed assets module' },
  { code: 'fixed-assets.create', name: 'Fixed Assets Module Create', module: 'fixed-assets', group: 'Fixed Assets', description: 'Create in fixed assets' },
  { code: 'fixed-assets.update', name: 'Fixed Assets Module Update', module: 'fixed-assets', group: 'Fixed Assets', description: 'Update fixed assets' },
  { code: 'fixed-assets.delete', name: 'Fixed Assets Module Delete', module: 'fixed-assets', group: 'Fixed Assets', description: 'Delete fixed assets' },
  { code: 'fixed-assets.transfer', name: 'Fixed Assets Module Transfer', module: 'fixed-assets', group: 'Fixed Assets', description: 'Transfer in fixed assets' },
  { code: 'fixed-assets.dispose', name: 'Fixed Assets Module Dispose', module: 'fixed-assets', group: 'Fixed Assets', description: 'Dispose in fixed assets' },
  { code: 'fixed-assets.depreciate', name: 'Fixed Assets Module Depreciate', module: 'fixed-assets', group: 'Fixed Assets', description: 'Depreciate fixed assets' },
  { code: 'fixed-assets.revalue', name: 'Fixed Assets Module Revalue', module: 'fixed-assets', group: 'Fixed Assets', description: 'Revalue fixed assets' },
  { code: 'fixed-assets.audit', name: 'Fixed Assets Module Audit', module: 'fixed-assets', group: 'Fixed Assets', description: 'Audit fixed assets' },
  { code: 'fixed-assets.maintenance', name: 'Fixed Assets Module Maintenance', module: 'fixed-assets', group: 'Fixed Assets', description: 'Maintenance in fixed assets' },
  { code: 'fixed-assets.insurance', name: 'Fixed Assets Module Insurance', module: 'fixed-assets', group: 'Fixed Assets', description: 'Insurance in fixed assets' },
  { code: 'fixed-assets.export', name: 'Fixed Assets Module Export', module: 'fixed-assets', group: 'Fixed Assets', description: 'Export fixed assets data' },
  // Asset categories permissions
  { code: 'asset-categories.read', name: 'Asset Categories Read', module: 'asset-categories', group: 'Fixed Assets', description: 'View asset categories' },
  { code: 'asset-categories.create', name: 'Asset Categories Create', module: 'asset-categories', group: 'Fixed Assets', description: 'Create asset categories' },
  { code: 'asset-categories.update', name: 'Asset Categories Update', module: 'asset-categories', group: 'Fixed Assets', description: 'Update asset categories' },
  { code: 'asset-categories.delete', name: 'Asset Categories Delete', module: 'asset-categories', group: 'Fixed Assets', description: 'Delete asset categories' },
  { code: 'asset-categories.export', name: 'Asset Categories Export', module: 'asset-categories', group: 'Fixed Assets', description: 'Export asset categories' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    for (const perm of PERMISSIONS) {
      // Check if permission already exists
      const [existing] = await sequelize.query(
        `SELECT id FROM permissions WHERE code = :code AND tenant_id = :tenantId`,
        { replacements: { code: perm.code, tenantId } }
      );

      if (existing.length > 0) {
        logger.info(`Permission ${perm.code} already exists, skipping`);
        continue;
      }

      // Insert permission
      const permId = uuidv4();
      await sequelize.query(
        `INSERT INTO permissions (id, tenant_id, name, code, module, \`group\`, description, is_active, created_at, updated_at)
         VALUES (:id, :tenantId, :name, :code, :module, :group, :description, 1, NOW(), NOW())`,
        {
          replacements: {
            id: permId,
            tenantId,
            name: perm.name,
            code: perm.code,
            module: perm.module,
            group: perm.group,
            description: perm.description,
          },
        }
      );

      // Assign to Super Admin role
      await sequelize.query(
        `INSERT INTO role_permissions (id, role_id, permission_id, tenant_id, created_by, updated_by, created_at, updated_at)
         VALUES (:id, :roleId, :permId, :tenantId, :userId, :userId, NOW(), NOW())`,
        {
          replacements: {
            id: uuidv4(),
            roleId: superAdminRoleId,
            permId,
            tenantId,
            userId: '00000000-0000-0000-0000-000000000001',
          },
        }
      );

      logger.info(`Permission ${perm.code} created and assigned to Super Admin`);
    }

    logger.info('Fixed Assets permissions seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
