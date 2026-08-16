'use strict';

const bcrypt = require('bcryptjs');

const tenantId = '11111111-1111-1111-1111-111111111111';
const superAdminUserId = '00000000-0000-0000-0000-000000000001';
const superAdminRoleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    await queryInterface.bulkInsert('users', [{
      id: superAdminUserId,
      username: 'superadmin',
      email: 'admin@erp.com',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+1-000-000-0000',
      is_active: true,
      is_locked: false,
      failed_login_attempts: 0,
      tenant_id: tenantId,
      created_by: superAdminUserId,
      updated_by: superAdminUserId,
      created_at: new Date(),
      updated_at: new Date(),
    }], {});

    // Assign Super Admin role
    await queryInterface.bulkInsert('user_roles', [{
      user_id: superAdminUserId,
      role_id: superAdminRoleId,
      tenant_id: tenantId,
      created_by: superAdminUserId,
      updated_by: superAdminUserId,
      created_at: new Date(),
      updated_at: new Date(),
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_roles', { user_id: superAdminUserId }, {});
    await queryInterface.bulkDelete('users', { id: superAdminUserId }, {});
  },
};