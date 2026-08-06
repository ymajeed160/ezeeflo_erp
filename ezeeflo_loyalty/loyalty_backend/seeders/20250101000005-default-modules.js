'use strict';
const { v4: uuidv4 } = require('uuid');

const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('subscription_modules', [
      { id: uuidv4(), name: 'Dashboard & Analytics', code: 'dashboard', description: 'Real-time dashboard and analytics', category: 'core', status: 'enabled', sort_order: 1, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Customer Management', code: 'customers', description: 'Customer profiles, segments, tags', category: 'core', status: 'enabled', sort_order: 2, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Loyalty Points Engine', code: 'points_engine', description: 'Configurable points earning rules', category: 'loyalty', status: 'enabled', sort_order: 3, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Membership Tiers', code: 'membership', description: 'Multi-tier membership management', category: 'loyalty', status: 'enabled', sort_order: 4, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Reward Catalog', code: 'rewards', description: 'Reward creation and redemption', category: 'loyalty', status: 'enabled', sort_order: 5, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Campaigns & Promotions', code: 'campaigns', description: 'Marketing campaigns and promotions', category: 'marketing', status: 'enabled', sort_order: 6, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Coupons', code: 'coupons', description: 'Digital coupon management', category: 'marketing', status: 'enabled', sort_order: 7, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Gift Cards', code: 'gift_cards', description: 'Gift card issuance and management', category: 'commerce', status: 'enabled', sort_order: 8, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Referral Program', code: 'referrals', description: 'Customer referral tracking', category: 'marketing', status: 'enabled', sort_order: 9, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Notifications', code: 'notifications', description: 'Email, SMS, Push notifications', category: 'communication', status: 'enabled', sort_order: 10, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'POS Integration', code: 'pos_integration', description: 'Connect with POS systems', category: 'integration', status: 'enabled', sort_order: 11, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'CRM Integration', code: 'crm_integration', description: 'Sync with CRM platforms', category: 'integration', status: 'enabled', sort_order: 12, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'REST API Access', code: 'api_access', description: 'External API access for integrations', category: 'integration', status: 'enabled', sort_order: 13, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Reports', code: 'reports', description: 'Comprehensive reporting suite', category: 'analytics', status: 'enabled', sort_order: 14, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Audit Trail', code: 'audit_trail', description: 'Full audit logging', category: 'security', status: 'enabled', sort_order: 15, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'Multi-Store / Branch', code: 'multi_store', description: 'Multiple store/branch support', category: 'enterprise', status: 'enabled', sort_order: 16, created_at: now, updated_at: now },
      { id: uuidv4(), name: 'White Label', code: 'white_label', description: 'Custom branding and domain', category: 'enterprise', status: 'beta', sort_order: 17, created_at: now, updated_at: now },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subscription_modules', null, {});
  },
};
