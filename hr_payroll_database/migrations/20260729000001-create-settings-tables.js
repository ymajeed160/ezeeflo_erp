'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── General Settings ──
    await queryInterface.createTable('settings_general', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      company_name: { type: Sequelize.STRING(200), allowNull: true },
      logo_url: { type: Sequelize.STRING(500), allowNull: true },
      address_line1: { type: Sequelize.STRING(255), allowNull: true },
      address_line2: { type: Sequelize.STRING(255), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(150), allowNull: true },
      website: { type: Sequelize.STRING(255), allowNull: true },
      tax_number: { type: Sequelize.STRING(50), allowNull: true },
      default_currency: { type: Sequelize.STRING(5), defaultValue: 'AED' },
      timezone: { type: Sequelize.STRING(50), defaultValue: 'Asia/Dubai' },
      language: { type: Sequelize.STRING(10), defaultValue: 'en' },
      date_format: { type: Sequelize.STRING(20), defaultValue: 'DD/MM/YYYY' },
      time_format: { type: Sequelize.STRING(10), defaultValue: '12h' },
      financial_year_start: { type: Sequelize.STRING(5), defaultValue: '01-01' },
      payroll_start_month: { type: Sequelize.INTEGER, defaultValue: 1 },
      company_working_days: { type: Sequelize.STRING(50), defaultValue: 'Mon,Tue,Wed,Thu,Fri' },
      week_start_day: { type: Sequelize.STRING(10), defaultValue: 'Monday' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('settings_general', ['tenant_id'], { unique: true });

    // ── Company Profile (extends general, one row per branch/location) ──
    await queryInterface.createTable('settings_company_profile', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      profile_type: { type: Sequelize.ENUM('branch', 'business_unit', 'location', 'cost_center'), allowNull: false },
      name: { type: Sequelize.STRING(200), allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: true },
      parent_id: { type: Sequelize.UUID, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(150), allowNull: true },
      manager_id: { type: Sequelize.UUID, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      metadata: { type: Sequelize.JSON, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('settings_company_profile', ['tenant_id', 'profile_type']);

    // ── Localization ──
    await queryInterface.createTable('settings_localization', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      language: { type: Sequelize.STRING(10), defaultValue: 'en' },
      languages_supported: { type: Sequelize.JSON, allowNull: true, comment: '["en","ar"]' },
      currency: { type: Sequelize.STRING(5), defaultValue: 'AED' },
      currency_symbol: { type: Sequelize.STRING(5), defaultValue: 'د.إ' },
      date_format: { type: Sequelize.STRING(20), defaultValue: 'DD/MM/YYYY' },
      number_format: { type: Sequelize.STRING(20), defaultValue: '#,###.##' },
      timezone: { type: Sequelize.STRING(50), defaultValue: 'Asia/Dubai' },
      country: { type: Sequelize.STRING(2), defaultValue: 'AE', comment: 'ISO 3166-1 alpha-2' },
      regional_holidays_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      country_specific_rules: { type: Sequelize.JSON, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('settings_localization', ['tenant_id'], { unique: true });

    // ── Working Hours ──
    await queryInterface.createTable('settings_working_hours', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      working_days: { type: Sequelize.STRING(50), defaultValue: 'Mon,Tue,Wed,Thu,Fri' },
      weekend_days: { type: Sequelize.STRING(30), defaultValue: 'Sat,Sun' },
      work_start_time: { type: Sequelize.TIME, defaultValue: '09:00:00' },
      work_end_time: { type: Sequelize.TIME, defaultValue: '18:00:00' },
      break_start_time: { type: Sequelize.TIME, allowNull: true },
      break_duration_minutes: { type: Sequelize.INTEGER, defaultValue: 0 },
      lunch_start_time: { type: Sequelize.TIME, allowNull: true },
      lunch_duration_minutes: { type: Sequelize.INTEGER, defaultValue: 60 },
      grace_period_minutes: { type: Sequelize.INTEGER, defaultValue: 15 },
      late_arrival_policy: { type: Sequelize.ENUM('deduct_leave', 'deduct_salary', 'warning', 'flexible'), defaultValue: 'warning' },
      late_deduction_type: { type: Sequelize.ENUM('per_minute', 'per_hour', 'half_day', 'full_day'), allowNull: true },
      early_departure_policy: { type: Sequelize.ENUM('deduct_leave', 'deduct_salary', 'warning', 'flexible'), defaultValue: 'warning' },
      flexible_hours_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      flexible_start_time: { type: Sequelize.TIME, allowNull: true },
      flexible_end_time: { type: Sequelize.TIME, allowNull: true },
      night_shift_start: { type: Sequelize.TIME, allowNull: true },
      night_shift_end: { type: Sequelize.TIME, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('settings_working_hours', ['tenant_id'], { unique: true });

    // ── Audit Log ──
    await queryInterface.createTable('settings_audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      username: { type: Sequelize.STRING(100), allowNull: true },
      module: { type: Sequelize.STRING(100), allowNull: false },
      section: { type: Sequelize.STRING(100), allowNull: false },
      field_name: { type: Sequelize.STRING(100), allowNull: true },
      old_value: { type: Sequelize.TEXT, allowNull: true },
      new_value: { type: Sequelize.TEXT, allowNull: true },
      action: { type: Sequelize.ENUM('create', 'update', 'delete'), allowNull: false },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('settings_audit_logs', ['tenant_id', 'module']);
    await queryInterface.addIndex('settings_audit_logs', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings_audit_logs');
    await queryInterface.dropTable('settings_working_hours');
    await queryInterface.dropTable('settings_localization');
    await queryInterface.dropTable('settings_company_profile');
    await queryInterface.dropTable('settings_general');
  },
};
