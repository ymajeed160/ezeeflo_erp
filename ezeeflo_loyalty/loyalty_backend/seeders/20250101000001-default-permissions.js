'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // First create a default company for super admin
    await queryInterface.bulkInsert('companies', [{
      id: '00000000-0000-0000-0000-000000000001',
      name: 'EzeeFlo Loyalty Platform',
      code: 'EZEEFLO',
      email: 'admin@ezeeflo.com',
      country: 'UAE',
      currency: 'AED',
      currency_symbol: '\u062F.\u0625',
      timezone: 'Asia/Dubai',
      status: 'active',
      subscription_status: 'active',
      created_at: now,
      updated_at: now,
    }]);

    const permissions = [
      // Dashboard
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Dashboard', code: 'dashboard.view', group_name: 'Dashboard', module: 'dashboard', created_at: now, updated_at: now },
      
      // Users
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Users', code: 'users.view', group_name: 'Users', module: 'users', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Create Users', code: 'users.create', group_name: 'Users', module: 'users', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Edit Users', code: 'users.edit', group_name: 'Users', module: 'users', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Delete Users', code: 'users.delete', group_name: 'Users', module: 'users', created_at: now, updated_at: now },

      // Roles
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Roles', code: 'roles.view', group_name: 'Roles', module: 'roles', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Create Roles', code: 'roles.create', group_name: 'Roles', module: 'roles', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Edit Roles', code: 'roles.edit', group_name: 'Roles', module: 'roles', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Delete Roles', code: 'roles.delete', group_name: 'Roles', module: 'roles', created_at: now, updated_at: now },

      // Permissions
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Permissions', code: 'permissions.view', group_name: 'Permissions', module: 'permissions', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Create Permissions', code: 'permissions.create', group_name: 'Permissions', module: 'permissions', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Edit Permissions', code: 'permissions.edit', group_name: 'Permissions', module: 'permissions', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Delete Permissions', code: 'permissions.delete', group_name: 'Permissions', module: 'permissions', created_at: now, updated_at: now },

      // Customers
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Customers', code: 'customers.view', group_name: 'Customers', module: 'customers', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Create Customers', code: 'customers.create', group_name: 'Customers', module: 'customers', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Edit Customers', code: 'customers.edit', group_name: 'Customers', module: 'customers', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Delete Customers', code: 'customers.delete', group_name: 'Customers', module: 'customers', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Merge Customers', code: 'customers.merge', group_name: 'Customers', module: 'customers', created_at: now, updated_at: now },

      // Loyalty Accounts
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Loyalty Accounts', code: 'loyalty.view', group_name: 'Loyalty', module: 'loyalty', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Points', code: 'points.manage', group_name: 'Loyalty', module: 'loyalty', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Transactions', code: 'transactions.view', group_name: 'Loyalty', module: 'loyalty', created_at: now, updated_at: now },

      // Membership
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Membership', code: 'membership.view', group_name: 'Membership', module: 'membership', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Membership', code: 'membership.manage', group_name: 'Membership', module: 'membership', created_at: now, updated_at: now },

      // Rewards
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Rewards', code: 'rewards.view', group_name: 'Rewards', module: 'rewards', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Rewards', code: 'rewards.manage', group_name: 'Rewards', module: 'rewards', created_at: now, updated_at: now },

      // Campaigns
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Campaigns', code: 'campaigns.view', group_name: 'Campaigns', module: 'campaigns', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Campaigns', code: 'campaigns.manage', group_name: 'Campaigns', module: 'campaigns', created_at: now, updated_at: now },

      // Coupons
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Coupons', code: 'coupons.view', group_name: 'Coupons', module: 'coupons', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Coupons', code: 'coupons.manage', group_name: 'Coupons', module: 'coupons', created_at: now, updated_at: now },

      // Gift Cards
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Gift Cards', code: 'giftcards.view', group_name: 'Gift Cards', module: 'giftcards', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Gift Cards', code: 'giftcards.manage', group_name: 'Gift Cards', module: 'giftcards', created_at: now, updated_at: now },

      // Referrals
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Referrals', code: 'referrals.view', group_name: 'Referrals', module: 'referrals', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Referrals', code: 'referrals.manage', group_name: 'Referrals', module: 'referrals', created_at: now, updated_at: now },

      // Reports
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Reports', code: 'reports.view', group_name: 'Reports', module: 'reports', created_at: now, updated_at: now },

      // Settings
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Settings', code: 'settings.view', group_name: 'Settings', module: 'settings', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage Settings', code: 'settings.manage', group_name: 'Settings', module: 'settings', created_at: now, updated_at: now },

      // API & Integrations
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'Manage API Keys', code: 'api.manage', group_name: 'API', module: 'api', created_at: now, updated_at: now },
      { id: uuidv4(), company_id: '00000000-0000-0000-0000-000000000001', name: 'View Audit Logs', code: 'audit.view', group_name: 'Security', module: 'audit', created_at: now, updated_at: now },
    ];

    await queryInterface.bulkInsert('permissions', permissions);
    return permissions;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
