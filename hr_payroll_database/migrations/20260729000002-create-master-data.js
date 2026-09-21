'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Countries ──
    await queryInterface.createTable('master_countries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING(5), allowNull: false, comment: 'ISO 3166-1 alpha-2' },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      nationality: { type: Sequelize.STRING(100), allowNull: true },
      nationality_ar: { type: Sequelize.STRING(100), allowNull: true },
      phone_code: { type: Sequelize.STRING(10), allowNull: true },
      currency_code: { type: Sequelize.STRING(5), allowNull: true },
      currency_symbol: { type: Sequelize.STRING(5), allowNull: true },
      flag_emoji: { type: Sequelize.STRING(10), allowNull: true },
      is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('master_countries', ['tenant_id', 'code'], { unique: true });
    await queryInterface.addIndex('master_countries', ['is_active']);

    // Seed default countries
    const countries = [
      { code: 'AE', name: 'United Arab Emirates', nationality: 'Emirati', phone_code: '+971', currency_code: 'AED', currency_symbol: 'د.إ', flag_emoji: '🇦🇪' },
      { code: 'SA', name: 'Saudi Arabia', nationality: 'Saudi', phone_code: '+966', currency_code: 'SAR', currency_symbol: '﷼', flag_emoji: '🇸🇦' },
      { code: 'QA', name: 'Qatar', nationality: 'Qatari', phone_code: '+974', currency_code: 'QAR', currency_symbol: 'ر.ق', flag_emoji: '🇶🇦' },
      { code: 'KW', name: 'Kuwait', nationality: 'Kuwaiti', phone_code: '+965', currency_code: 'KWD', currency_symbol: 'د.ك', flag_emoji: '🇰🇼' },
      { code: 'BH', name: 'Bahrain', nationality: 'Bahraini', phone_code: '+973', currency_code: 'BHD', currency_symbol: '.د.ب', flag_emoji: '🇧🇭' },
      { code: 'OM', name: 'Oman', nationality: 'Omani', phone_code: '+968', currency_code: 'OMR', currency_symbol: 'ر.ع.', flag_emoji: '🇴🇲' },
      { code: 'IN', name: 'India', nationality: 'Indian', phone_code: '+91', currency_code: 'INR', currency_symbol: '₹', flag_emoji: '🇮🇳' },
      { code: 'PK', name: 'Pakistan', nationality: 'Pakistani', phone_code: '+92', currency_code: 'PKR', currency_symbol: '₨', flag_emoji: '🇵🇰' },
      { code: 'EG', name: 'Egypt', nationality: 'Egyptian', phone_code: '+20', currency_code: 'EGP', currency_symbol: 'E£', flag_emoji: '🇪🇬' },
      { code: 'JO', name: 'Jordan', nationality: 'Jordanian', phone_code: '+962', currency_code: 'JOD', currency_symbol: 'د.ا', flag_emoji: '🇯🇴' },
      { code: 'LB', name: 'Lebanon', nationality: 'Lebanese', phone_code: '+961', currency_code: 'LBP', currency_symbol: 'ل.ل', flag_emoji: '🇱🇧' },
      { code: 'GB', name: 'United Kingdom', nationality: 'British', phone_code: '+44', currency_code: 'GBP', currency_symbol: '£', flag_emoji: '🇬🇧' },
      { code: 'US', name: 'United States', nationality: 'American', phone_code: '+1', currency_code: 'USD', currency_symbol: '$', flag_emoji: '🇺🇸' },
      { code: 'PH', name: 'Philippines', nationality: 'Filipino', phone_code: '+63', currency_code: 'PHP', currency_symbol: '₱', flag_emoji: '🇵🇭' },
      { code: 'BD', name: 'Bangladesh', nationality: 'Bangladeshi', phone_code: '+880', currency_code: 'BDT', currency_symbol: '৳', flag_emoji: '🇧🇩' },
      { code: 'LK', name: 'Sri Lanka', nationality: 'Sri Lankan', phone_code: '+94', currency_code: 'LKR', currency_symbol: 'රු', flag_emoji: '🇱🇰' },
      { code: 'NP', name: 'Nepal', nationality: 'Nepali', phone_code: '+977', currency_code: 'NPR', currency_symbol: 'रू', flag_emoji: '🇳🇵' },
    ];

    const tenantId = '11111111-1111-1111-1111-111111111111';
    const rows = countries.map((c, i) => ({
      id: Sequelize.literal('UUID()'),
      tenant_id: tenantId,
      code: c.code,
      name: c.name,
      nationality: c.nationality,
      phone_code: c.phone_code,
      currency_code: c.currency_code,
      currency_symbol: c.currency_symbol,
      flag_emoji: c.flag_emoji,
      is_system: true,
      is_active: true,
      sort_order: i + 1,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    await queryInterface.bulkInsert('master_countries', rows);

    // ── Generic Master Data table (for all simple types) ──
    await queryInterface.createTable('master_data', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      type: { type: Sequelize.STRING(50), allowNull: false, comment: 'Entity type: employment_type, leave_type, skill, etc.' },
      code: { type: Sequelize.STRING(50), allowNull: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      name_ar: { type: Sequelize.STRING(200), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      parent_id: { type: Sequelize.UUID, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true, comment: 'Extra type-specific fields' },
      is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      deleted_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('master_data', ['tenant_id', 'type', 'code'], { unique: true });
    await queryInterface.addIndex('master_data', ['tenant_id', 'type', 'is_active']);
    await queryInterface.addIndex('master_data', ['type', 'name']);

    // ── Master Data Audit ──
    await queryInterface.createTable('master_data_audit', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      record_id: { type: Sequelize.UUID, allowNull: false },
      record_type: { type: Sequelize.STRING(50), allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true },
      username: { type: Sequelize.STRING(100), allowNull: true },
      action: { type: Sequelize.ENUM('create', 'update', 'delete', 'restore', 'activate', 'deactivate'), allowNull: false },
      field_name: { type: Sequelize.STRING(100), allowNull: true },
      old_value: { type: Sequelize.TEXT, allowNull: true },
      new_value: { type: Sequelize.TEXT, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('master_data_audit', ['tenant_id', 'record_type']);
    await queryInterface.addIndex('master_data_audit', ['record_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('master_data_audit');
    await queryInterface.dropTable('master_data');
    await queryInterface.dropTable('master_countries');
  },
};
