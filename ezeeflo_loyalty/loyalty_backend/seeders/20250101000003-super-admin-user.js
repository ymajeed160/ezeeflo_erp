'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);

    await queryInterface.bulkInsert('users', [{
      id: uuidv4(),
      company_id: COMPANY_ID,
      username: 'superadmin',
      email: 'superadmin@ezeeflo.com',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      is_active: true,
      is_super_admin: true,
      email_verified: true,
      created_at: now,
      updated_at: now,
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'superadmin' });
  },
};
