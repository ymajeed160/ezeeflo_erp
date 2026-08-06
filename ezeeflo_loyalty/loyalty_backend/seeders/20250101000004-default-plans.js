'use strict';
const { v4: uuidv4 } = require('uuid');

const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('subscription_plans', [
      { id: uuidv4(), name: 'Starter', code: 'starter', description: 'For small businesses getting started with loyalty', price: 0.00, billing_cycle: 'monthly', max_companies: 1, max_users: 3, max_customers: 500, max_api_calls: 5000, storage_limit_mb: 100, is_active: true, sort_order: 1, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Professional', code: 'professional', description: 'For growing businesses with advanced loyalty needs', price: 99.00, billing_cycle: 'monthly', max_companies: 1, max_users: 10, max_customers: 5000, max_api_calls: 50000, storage_limit_mb: 500, is_active: true, sort_order: 2, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Enterprise', code: 'enterprise', description: 'For large enterprises with unlimited possibilities', price: 299.00, billing_cycle: 'monthly', max_companies: 5, max_users: 50, max_customers: 50000, max_api_calls: 500000, storage_limit_mb: 2000, is_active: true, sort_order: 3, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Custom', code: 'custom', description: 'Tailored solution for unique requirements', price: 0.00, billing_cycle: 'monthly', max_companies: 1, max_users: 999, max_customers: 999999, max_api_calls: 9999999, storage_limit_mb: 10000, is_active: true, sort_order: 4, created_at: now, updated_at: now },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  },
};
