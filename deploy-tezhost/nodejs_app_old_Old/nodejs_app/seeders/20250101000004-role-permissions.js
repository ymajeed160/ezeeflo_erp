'use strict';
const { v4: uuidv4 } = require('uuid');

const tenantId = '11111111-1111-1111-1111-111111111111';
const userId = '00000000-0000-0000-0000-000000000001';
const superAdminRoleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all permissions
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE tenant_id = :tenantId`,
      { replacements: { tenantId } }
    );

    // Assign ALL permissions to Super Admin role
    const rolePermissions = permissions.map(p => ({
      id: uuidv4(),
      role_id: superAdminRoleId,
      permission_id: p.id,
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', { tenant_id: tenantId }, {});
  },
};