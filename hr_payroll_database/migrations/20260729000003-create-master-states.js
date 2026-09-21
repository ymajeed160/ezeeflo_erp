'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_states', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      country_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'master_countries', key: 'id' } },
      code: { type: Sequelize.STRING(10), allowNull: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('master_states', ['tenant_id', 'country_id']);
    await queryInterface.addIndex('master_states', ['country_id', 'name']);

    // Seed UAE states
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const uaeStates = [
      { code: 'AUH', name: 'Abu Dhabi', name_ar: 'أبو ظبي' },
      { code: 'DXB', name: 'Dubai', name_ar: 'دبي' },
      { code: 'SHJ', name: 'Sharjah', name_ar: 'الشارقة' },
      { code: 'AJM', name: 'Ajman', name_ar: 'عجمان' },
      { code: 'UAQ', name: 'Umm Al Quwain', name_ar: 'أم القيوين' },
      { code: 'RAK', name: 'Ras Al Khaimah', name_ar: 'رأس الخيمة' },
      { code: 'FUJ', name: 'Fujairah', name_ar: 'الفجيرة' },
    ];
    const [countries] = await queryInterface.sequelize.query("SELECT id, code FROM master_countries WHERE code = 'AE' AND tenant_id = ?", { replacements: [tenantId] });
    const aeId = countries[0]?.id;
    if (aeId) {
      await queryInterface.bulkInsert('master_states',
        uaeStates.map((s, i) => ({
          id: Sequelize.literal('UUID()'), tenant_id: tenantId, country_id: aeId,
          code: s.code, name: s.name, name_ar: s.name_ar,
          is_system: true, is_active: true, sort_order: i + 1,
          created_at: new Date(), updated_at: new Date(),
        }))
      );
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable('master_states');
  },
};
