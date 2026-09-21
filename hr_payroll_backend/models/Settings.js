const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── General Settings ──
const GeneralSetting = sequelize.define('GeneralSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  companyName: { type: DataTypes.STRING(200), field: 'company_name' },
  logoUrl: { type: DataTypes.STRING(500), field: 'logo_url' },
  addressLine1: { type: DataTypes.STRING(255), field: 'address_line1' },
  addressLine2: { type: DataTypes.STRING(255), field: 'address_line2' },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  country: { type: DataTypes.STRING(100) },
  postalCode: { type: DataTypes.STRING(20), field: 'postal_code' },
  phone: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(150) },
  website: { type: DataTypes.STRING(255) },
  taxNumber: { type: DataTypes.STRING(50), field: 'tax_number' },
  defaultCurrency: { type: DataTypes.STRING(5), defaultValue: 'AED', field: 'default_currency' },
  timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Dubai' },
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
  dateFormat: { type: DataTypes.STRING(20), defaultValue: 'DD/MM/YYYY', field: 'date_format' },
  timeFormat: { type: DataTypes.STRING(10), defaultValue: '12h', field: 'time_format' },
  financialYearStart: { type: DataTypes.STRING(5), defaultValue: '01-01', field: 'financial_year_start' },
  payrollStartMonth: { type: DataTypes.INTEGER, defaultValue: 1, field: 'payroll_start_month' },
  companyWorkingDays: { type: DataTypes.STRING(50), defaultValue: 'Mon,Tue,Wed,Thu,Fri', field: 'company_working_days' },
  weekStartDay: { type: DataTypes.STRING(10), defaultValue: 'Monday', field: 'week_start_day' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_general', timestamps: true, underscored: true });

// ── Company Profile ──
const CompanyProfile = sequelize.define('CompanyProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  profileType: { type: DataTypes.ENUM('branch', 'business_unit', 'location', 'cost_center'), allowNull: false, field: 'profile_type' },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50) },
  parentId: { type: DataTypes.UUID, field: 'parent_id' },
  address: { type: DataTypes.TEXT },
  phone: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(150) },
  managerId: { type: DataTypes.UUID, field: 'manager_id' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  metadata: { type: DataTypes.JSON },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_company_profile', timestamps: true, underscored: true });

// ── Localization ──
const LocalizationSetting = sequelize.define('LocalizationSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
  languagesSupported: { type: DataTypes.JSON, field: 'languages_supported' },
  currency: { type: DataTypes.STRING(5), defaultValue: 'AED' },
  currencySymbol: { type: DataTypes.STRING(5), defaultValue: 'د.إ', field: 'currency_symbol' },
  dateFormat: { type: DataTypes.STRING(20), defaultValue: 'DD/MM/YYYY', field: 'date_format' },
  numberFormat: { type: DataTypes.STRING(20), defaultValue: '#,###.##', field: 'number_format' },
  timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Dubai' },
  country: { type: DataTypes.STRING(2), defaultValue: 'AE' },
  regionalHolidaysEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'regional_holidays_enabled' },
  countrySpecificRules: { type: DataTypes.JSON, field: 'country_specific_rules' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_localization', timestamps: true, underscored: true });

// ── Working Hours ──
const WorkingHourSetting = sequelize.define('WorkingHourSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  workingDays: { type: DataTypes.STRING(50), defaultValue: 'Mon,Tue,Wed,Thu,Fri', field: 'working_days' },
  weekendDays: { type: DataTypes.STRING(30), defaultValue: 'Sat,Sun', field: 'weekend_days' },
  workStartTime: { type: DataTypes.TIME, defaultValue: '09:00:00', field: 'work_start_time' },
  workEndTime: { type: DataTypes.TIME, defaultValue: '18:00:00', field: 'work_end_time' },
  breakStartTime: { type: DataTypes.TIME, field: 'break_start_time' },
  breakDurationMinutes: { type: DataTypes.INTEGER, defaultValue: 0, field: 'break_duration_minutes' },
  lunchStartTime: { type: DataTypes.TIME, field: 'lunch_start_time' },
  lunchDurationMinutes: { type: DataTypes.INTEGER, defaultValue: 60, field: 'lunch_duration_minutes' },
  gracePeriodMinutes: { type: DataTypes.INTEGER, defaultValue: 15, field: 'grace_period_minutes' },
  lateArrivalPolicy: { type: DataTypes.ENUM('deduct_leave', 'deduct_salary', 'warning', 'flexible'), defaultValue: 'warning', field: 'late_arrival_policy' },
  lateDeductionType: { type: DataTypes.ENUM('per_minute', 'per_hour', 'half_day', 'full_day'), field: 'late_deduction_type' },
  earlyDeparturePolicy: { type: DataTypes.ENUM('deduct_leave', 'deduct_salary', 'warning', 'flexible'), defaultValue: 'warning', field: 'early_departure_policy' },
  flexibleHoursEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'flexible_hours_enabled' },
  flexibleStartTime: { type: DataTypes.TIME, field: 'flexible_start_time' },
  flexibleEndTime: { type: DataTypes.TIME, field: 'flexible_end_time' },
  nightShiftStart: { type: DataTypes.TIME, field: 'night_shift_start' },
  nightShiftEnd: { type: DataTypes.TIME, field: 'night_shift_end' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_working_hours', timestamps: true, underscored: true });

// ── Audit Log ──
const SettingsAuditLog = sequelize.define('SettingsAuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  userId: { type: DataTypes.UUID, field: 'user_id' },
  username: { type: DataTypes.STRING(100) },
  module: { type: DataTypes.STRING(100), allowNull: false },
  section: { type: DataTypes.STRING(100), allowNull: false },
  fieldName: { type: DataTypes.STRING(100), field: 'field_name' },
  oldValue: { type: DataTypes.TEXT, field: 'old_value' },
  newValue: { type: DataTypes.TEXT, field: 'new_value' },
  action: { type: DataTypes.ENUM('create', 'update', 'delete'), allowNull: false },
  ipAddress: { type: DataTypes.STRING(45), field: 'ip_address' },
  userAgent: { type: DataTypes.STRING(500), field: 'user_agent' },
}, { tableName: 'settings_audit_logs', timestamps: true, underscored: true, updatedAt: false });



// ═══ Attendance Settings ═══
const AttendanceSetting = sequelize.define('AttendanceSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  overtimeEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'overtime_enabled' },
  overtimeDailyLimit: { type: DataTypes.INTEGER, defaultValue: 120, field: 'overtime_daily_limit' },
  overtimeWeeklyLimit: { type: DataTypes.INTEGER, defaultValue: 480, field: 'overtime_weekly_limit' },
  overtimeRate: { type: DataTypes.DECIMAL(4,2), defaultValue: 1.5, field: 'overtime_rate' },
  overtimeHolidayRate: { type: DataTypes.DECIMAL(4,2), defaultValue: 2.0, field: 'overtime_holiday_rate' },
  autoDeductionEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'auto_deduction_enabled' },
  lateDeductionType: { type: DataTypes.STRING(20), field: 'late_deduction_type' },
  lateDeductionAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0, field: 'late_deduction_amount' },
  biometricRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'biometric_required' },
  geoFencingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'geo_fencing_enabled' },
  geoFencingRadius: { type: DataTypes.INTEGER, defaultValue: 100, field: 'geo_fencing_radius' },
  ipRestrictionEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'ip_restriction_enabled' },
  allowedIps: { type: DataTypes.TEXT, field: 'allowed_ips' },
  halfDayThreshold: { type: DataTypes.INTEGER, defaultValue: 240, field: 'half_day_threshold' },
  absentThreshold: { type: DataTypes.INTEGER, defaultValue: 480, field: 'absent_threshold' },
  weekendOvertimeRate: { type: DataTypes.DECIMAL(4,2), defaultValue: 1.5, field: 'weekend_overtime_rate' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_attendance', timestamps: true, underscored: true });

// ═══ Leave Settings ═══
const LeaveSetting = sequelize.define('LeaveSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  leaveYearStart: { type: DataTypes.STRING(5), defaultValue: '01-01', field: 'leave_year_start' },
  accrualMethod: { type: DataTypes.STRING(20), field: 'accrual_method' },
  accrualRate: { type: DataTypes.DECIMAL(5,2), defaultValue: 2.5, field: 'accrual_rate' },
  carryForwardEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'carry_forward_enabled' },
  carryForwardMax: { type: DataTypes.INTEGER, defaultValue: 30, field: 'carry_forward_max' },
  carryForwardExpiry: { type: DataTypes.STRING(5), defaultValue: '03-31', field: 'carry_forward_expiry' },
  negativeBalanceAllowed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'negative_balance_allowed' },
  negativeBalanceMax: { type: DataTypes.INTEGER, defaultValue: 0, field: 'negative_balance_max' },
  approvalWorkflow: { type: DataTypes.STRING(20), field: 'approval_workflow' },
  autoApproveEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'auto_approve_enabled' },
  minNoticeDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_notice_days' },
  maxConsecutiveDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'max_consecutive_days' },
  weekendIncluded: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'weekend_included' },
  holidayIncluded: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'holiday_included' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_leave', timestamps: true, underscored: true });

// ═══ Payroll Settings ═══
const PayrollSetting = sequelize.define('PayrollSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  payrollFrequency: { type: DataTypes.STRING(20), field: 'payroll_frequency' },
  payDay: { type: DataTypes.INTEGER, defaultValue: 28, field: 'pay_day' },
  salaryCutoffDay: { type: DataTypes.INTEGER, defaultValue: 25, field: 'salary_cutoff_day' },
  wpsEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'wps_enabled' },
  wpsAgentCode: { type: DataTypes.STRING(50), field: 'wps_agent_code' },
  basicSalaryPercentage: { type: DataTypes.DECIMAL(5,2), defaultValue: 60, field: 'basic_salary_percentage' },
  housingAllowancePercentage: { type: DataTypes.DECIMAL(5,2), defaultValue: 20, field: 'housing_allowance_percentage' },
  transportAllowancePercentage: { type: DataTypes.DECIMAL(5,2), defaultValue: 10, field: 'transport_allowance_percentage' },
  otherAllowancePercentage: { type: DataTypes.DECIMAL(5,2), defaultValue: 10, field: 'other_allowance_percentage' },
  overtimeCalculation: { type: DataTypes.STRING(20), field: 'overtime_calculation' },
  deductionCalculation: { type: DataTypes.STRING(20), field: 'deduction_calculation' },
  taxEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'tax_enabled' },
  socialSecurityEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'social_security_enabled' },
  socialSecurityRate: { type: DataTypes.DECIMAL(5,2), defaultValue: 0, field: 'social_security_rate' },
  gratuityEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'gratuity_enabled' },
  gratuityCalculation: { type: DataTypes.STRING(20), field: 'gratuity_calculation' },
  payslipLanguage: { type: DataTypes.STRING(10), defaultValue: 'en', field: 'payslip_language' },
  payslipFormat: { type: DataTypes.STRING(20), defaultValue: 'pdf', field: 'payslip_format' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_payroll', timestamps: true, underscored: true });

// ═══ Security Settings ═══
const SecuritySetting = sequelize.define('SecuritySetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  passwordMinLength: { type: DataTypes.INTEGER, defaultValue: 8, field: 'password_min_length' },
  passwordComplexity: { type: DataTypes.STRING(20), field: 'password_complexity' },
  passwordExpiryDays: { type: DataTypes.INTEGER, defaultValue: 90, field: 'password_expiry_days' },
  sessionTimeoutMinutes: { type: DataTypes.INTEGER, defaultValue: 30, field: 'session_timeout_minutes' },
  maxLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 5, field: 'max_login_attempts' },
  lockoutDurationMinutes: { type: DataTypes.INTEGER, defaultValue: 15, field: 'lockout_duration_minutes' },
  mfaEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'mfa_enabled' },
  mfaType: { type: DataTypes.STRING(20), field: 'mfa_type' },
  ipWhitelistingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'ip_whitelisting_enabled' },
  allowedIps: { type: DataTypes.TEXT, field: 'allowed_ips' },
  auditLogRetentionDays: { type: DataTypes.INTEGER, defaultValue: 90, field: 'audit_log_retention_days' },
  dataEncryptionEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'data_encryption_enabled' },
  forcePasswordReset: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'force_password_reset' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_security', timestamps: true, underscored: true });

// ═══ Email Settings ═══
const EmailSetting = sequelize.define('EmailSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  smtpHost: { type: DataTypes.STRING(255), field: 'smtp_host' },
  smtpPort: { type: DataTypes.INTEGER, defaultValue: 587, field: 'smtp_port' },
  smtpUsername: { type: DataTypes.STRING(255), field: 'smtp_username' },
  smtpPassword: { type: DataTypes.STRING(500), field: 'smtp_password' },
  smtpEncryption: { type: DataTypes.STRING(10), defaultValue: 'tls', field: 'smtp_encryption' },
  fromName: { type: DataTypes.STRING(150), field: 'from_name' },
  fromEmail: { type: DataTypes.STRING(150), field: 'from_email' },
  replyTo: { type: DataTypes.STRING(150), field: 'reply_to' },
  emailFooter: { type: DataTypes.TEXT, field: 'email_footer' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_email', timestamps: true, underscored: true });

// ═══ SMS Settings ═══
const SmsSetting = sequelize.define('SmsSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  provider: { type: DataTypes.STRING(20) },
  apiKey: { type: DataTypes.STRING(500), field: 'api_key' },
  apiSecret: { type: DataTypes.STRING(500), field: 'api_secret' },
  senderId: { type: DataTypes.STRING(20), field: 'sender_id' },
  apiUrl: { type: DataTypes.STRING(500), field: 'api_url' },
  dailyLimit: { type: DataTypes.INTEGER, defaultValue: 1000, field: 'daily_limit' },
  balanceAlertThreshold: { type: DataTypes.INTEGER, defaultValue: 100, field: 'balance_alert_threshold' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_sms', timestamps: true, underscored: true });

// ═══ Notification Settings ═══
const NotificationSetting = sequelize.define('NotificationSetting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'email_notifications' },
  smsNotifications: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'sms_notifications' },
  pushNotifications: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'push_notifications' },
  leaveAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'leave_alert' },
  attendanceAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'attendance_alert' },
  payrollAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'payroll_alert' },
  documentExpiryAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'document_expiry_alert' },
  birthdayAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'birthday_alert' },
  onboardingAlert: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'onboarding_alert' },
  alertDaysBefore: { type: DataTypes.INTEGER, defaultValue: 7, field: 'alert_days_before' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'settings_notifications', timestamps: true, underscored: true });

module.exports = { GeneralSetting, CompanyProfile, LocalizationSetting, WorkingHourSetting, AttendanceSetting, LeaveSetting, PayrollSetting, SecuritySetting, EmailSetting, SmsSetting, NotificationSetting, SettingsAuditLog };
