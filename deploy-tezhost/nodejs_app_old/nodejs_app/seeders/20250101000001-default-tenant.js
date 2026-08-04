'use strict';
const { v4: uuidv4 } = require('uuid');

const tenantId = '11111111-1111-1111-1111-111111111111';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('tenants', [{
      id: tenantId,
      name: 'Default Organization',
      subdomain: 'default',
      email: 'admin@erp.com',
      phone: '+1-000-000-0000',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10001',
      is_active: true,
      subscription_plan: 'enterprise',
      subscription_expiry: new Date('2030-12-31'),
      max_users: 100,
      timezone: '+04:00',
      currency_code: 'AED',
      date_format: 'DD/MM/YYYY',
      created_at: new Date(),
      updated_at: new Date(),
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tenants', { id: tenantId }, {});
  },
};