'use strict';
const { v4: uuidv4 } = require('uuid');

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('membership_tiers', [
      { id: uuidv4(), company_id: COMPANY_ID, name: 'Standard', code: 'standard', description: 'Entry-level membership', min_points: 0, max_points: 499, point_multiplier: 1.00, benefits: JSON.stringify({ birthday_bonus: true }), color: '#6B7280', sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), company_id: COMPANY_ID, name: 'Silver', code: 'silver', description: 'Silver tier membership', min_points: 500, max_points: 1999, point_multiplier: 1.25, benefits: JSON.stringify({ birthday_bonus: true, priority_support: true }), color: '#9CA3AF', sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), company_id: COMPANY_ID, name: 'Gold', code: 'gold', description: 'Gold tier membership', min_points: 2000, max_points: 4999, point_multiplier: 1.50, benefits: JSON.stringify({ birthday_bonus: true, priority_support: true, free_shipping: true }), color: '#F59E0B', sort_order: 3, is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), company_id: COMPANY_ID, name: 'Platinum', code: 'platinum', description: 'Platinum tier membership', min_points: 5000, max_points: 9999, point_multiplier: 2.00, benefits: JSON.stringify({ birthday_bonus: true, priority_support: true, free_shipping: true, exclusive_events: true }), color: '#8B5CF6', sort_order: 4, is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), company_id: COMPANY_ID, name: 'Diamond', code: 'diamond', description: 'Diamond tier membership', min_points: 10000, max_points: 24999, point_multiplier: 2.50, benefits: JSON.stringify({ birthday_bonus: true, priority_support: true, free_shipping: true, exclusive_events: true, personal_manager: true }), color: '#06B6D4', sort_order: 5, is_active: true, created_at: now, updated_at: now },
      { id: uuidv4(), company_id: COMPANY_ID, name: 'VIP', code: 'vip', description: 'VIP tier - by invitation only', min_points: 25000, max_points: null, point_multiplier: 3.00, benefits: JSON.stringify({ birthday_bonus: true, priority_support: true, free_shipping: true, exclusive_events: true, personal_manager: true, concierge: true }), color: '#EF4444', sort_order: 6, is_active: true, created_at: now, updated_at: now },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('membership_tiers', { company_id: COMPANY_ID });
  },
};
