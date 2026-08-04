'use strict';

const tenantId = '11111111-1111-1111-1111-111111111111';
const userId = '00000000-0000-0000-0000-000000000001';

const superAdminRoleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const adminRoleId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const userRoleId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id: superAdminRoleId,
        name: 'Super Admin',
        code: 'super_admin',
        description: 'Full system access with all permissions',
        tenant_id: tenantId,
        is_system: true,
        is_active: true,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: adminRoleId,
        name: 'Admin',
        code: 'admin',
        description: 'Administrative access with most permissions',
        tenant_id: tenantId,
        is_system: false,
        is_active: true,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: userRoleId,
        name: 'User',
        code: 'user',
        description: 'Standard user with limited permissions',
        tenant_id: tenantId,
        is_system: false,
        is_active: true,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', { tenant_id: tenantId }, {});
  },
};