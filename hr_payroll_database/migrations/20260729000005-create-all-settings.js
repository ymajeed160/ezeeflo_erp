'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Attendance Settings
    await queryInterface.createTable('settings_attendance', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      overtime_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      overtime_daily_limit: { type: Sequelize.INTEGER, defaultValue: 120 },
      overtime_weekly_limit: { type: Sequelize.INTEGER, defaultValue: 480 },
      overtime_rate: { type: Sequelize.DECIMAL(4,2), defaultValue: 1.5 },
      overtime_holiday_rate: { type: Sequelize.DECIMAL(4,2), defaultValue: 2.0 },
      auto_deduction_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      late_deduction_type: { type: Sequelize.ENUM('per_minute','per_hour','fixed') },
      late_deduction_amount: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      biometric_required: { type: Sequelize.BOOLEAN, defaultValue: false },
      geo_fencing_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      geo_fencing_radius: { type: Sequelize.INTEGER, defaultValue: 100 },
      ip_restriction_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      allowed_ips: { type: Sequelize.TEXT },
      half_day_threshold: { type: Sequelize.INTEGER, defaultValue: 240 },
      absent_threshold: { type: Sequelize.INTEGER, defaultValue: 480 },
      weekend_overtime_rate: { type: Sequelize.DECIMAL(4,2), defaultValue: 1.5 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Leave Settings
    await queryInterface.createTable('settings_leave', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      leave_year_start: { type: Sequelize.STRING(5), defaultValue: '01-01' },
      accrual_method: { type: Sequelize.ENUM('monthly','quarterly','annual','custom') },
      accrual_rate: { type: Sequelize.DECIMAL(5,2), defaultValue: 2.5 },
      carry_forward_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      carry_forward_max: { type: Sequelize.INTEGER, defaultValue: 30 },
      carry_forward_expiry: { type: Sequelize.STRING(5), defaultValue: '03-31' },
      negative_balance_allowed: { type: Sequelize.BOOLEAN, defaultValue: false },
      negative_balance_max: { type: Sequelize.INTEGER, defaultValue: 0 },
      approval_workflow: { type: Sequelize.ENUM('direct_manager','multi_level','hr_only') },
      auto_approve_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      min_notice_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      max_consecutive_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      weekend_included: { type: Sequelize.BOOLEAN, defaultValue: false },
      holiday_included: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Payroll Settings
    await queryInterface.createTable('settings_payroll', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      payroll_frequency: { type: Sequelize.ENUM('monthly','bi-weekly','weekly') },
      pay_day: { type: Sequelize.INTEGER, defaultValue: 28 },
      salary_cutoff_day: { type: Sequelize.INTEGER, defaultValue: 25 },
      wps_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      wps_agent_code: { type: Sequelize.STRING(50) },
      basic_salary_percentage: { type: Sequelize.DECIMAL(5,2), defaultValue: 60 },
      housing_allowance_percentage: { type: Sequelize.DECIMAL(5,2), defaultValue: 20 },
      transport_allowance_percentage: { type: Sequelize.DECIMAL(5,2), defaultValue: 10 },
      other_allowance_percentage: { type: Sequelize.DECIMAL(5,2), defaultValue: 10 },
      overtime_calculation: { type: Sequelize.ENUM('basic_only','gross_salary') },
      deduction_calculation: { type: Sequelize.ENUM('gross','basic') },
      tax_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      social_security_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      social_security_rate: { type: Sequelize.DECIMAL(5,2), defaultValue: 0 },
      gratuity_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      gratuity_calculation: { type: Sequelize.ENUM('basic_salary','gross_salary') },
      payslip_language: { type: Sequelize.STRING(10), defaultValue: 'en' },
      payslip_format: { type: Sequelize.STRING(20), defaultValue: 'pdf' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Security Settings
    await queryInterface.createTable('settings_security', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      password_min_length: { type: Sequelize.INTEGER, defaultValue: 8 },
      password_complexity: { type: Sequelize.ENUM('low','medium','high') },
      password_expiry_days: { type: Sequelize.INTEGER, defaultValue: 90 },
      session_timeout_minutes: { type: Sequelize.INTEGER, defaultValue: 30 },
      max_login_attempts: { type: Sequelize.INTEGER, defaultValue: 5 },
      lockout_duration_minutes: { type: Sequelize.INTEGER, defaultValue: 15 },
      mfa_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      mfa_type: { type: Sequelize.ENUM('sms','email','authenticator') },
      ip_whitelisting_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      allowed_ips: { type: Sequelize.TEXT },
      audit_log_retention_days: { type: Sequelize.INTEGER, defaultValue: 90 },
      data_encryption_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      force_password_reset: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Email Settings
    await queryInterface.createTable('settings_email', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      smtp_host: { type: Sequelize.STRING(255) },
      smtp_port: { type: Sequelize.INTEGER, defaultValue: 587 },
      smtp_username: { type: Sequelize.STRING(255) },
      smtp_password: { type: Sequelize.STRING(500) },
      smtp_encryption: { type: Sequelize.ENUM('none','ssl','tls'), defaultValue: 'tls' },
      from_name: { type: Sequelize.STRING(150) },
      from_email: { type: Sequelize.STRING(150) },
      reply_to: { type: Sequelize.STRING(150) },
      email_footer: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // SMS Settings
    await queryInterface.createTable('settings_sms', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      provider: { type: Sequelize.ENUM('twilio','nexmo','infobip','custom') },
      api_key: { type: Sequelize.STRING(500) },
      api_secret: { type: Sequelize.STRING(500) },
      sender_id: { type: Sequelize.STRING(20) },
      api_url: { type: Sequelize.STRING(500) },
      daily_limit: { type: Sequelize.INTEGER, defaultValue: 1000 },
      balance_alert_threshold: { type: Sequelize.INTEGER, defaultValue: 100 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // Notification Settings
    await queryInterface.createTable('settings_notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      email_notifications: { type: Sequelize.BOOLEAN, defaultValue: true },
      sms_notifications: { type: Sequelize.BOOLEAN, defaultValue: false },
      push_notifications: { type: Sequelize.BOOLEAN, defaultValue: true },
      leave_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      attendance_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      payroll_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      document_expiry_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      birthday_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      onboarding_alert: { type: Sequelize.BOOLEAN, defaultValue: true },
      alert_days_before: { type: Sequelize.INTEGER, defaultValue: 7 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings_attendance');
    await queryInterface.dropTable('settings_leave');
    await queryInterface.dropTable('settings_payroll');
    await queryInterface.dropTable('settings_security');
    await queryInterface.dropTable('settings_email');
    await queryInterface.dropTable('settings_sms');
    await queryInterface.dropTable('settings_notifications');
  },
};
