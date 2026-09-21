'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_cities', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      state_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'master_states', key: 'id' } },
      country_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'master_countries', key: 'id' } },
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
    await queryInterface.addIndex('master_cities', ['tenant_id', 'country_id']);
    await queryInterface.addIndex('master_cities', ['state_id', 'name']);

    const tenantId = '11111111-1111-1111-1111-111111111111';
    const [states] = await queryInterface.sequelize.query("SELECT id, code, country_id FROM master_states WHERE tenant_id = ?", { replacements: [tenantId] });
    const aeId = states[0]?.country_id;
    if (aeId) {
      const cityMap = {
        AUH: ['Abu Dhabi City', 'Al Ain', 'Madinat Zayed'],
        DXB: ['Dubai City', 'Jebel Ali', 'Al Barsha'],
        SHJ: ['Sharjah City', 'Khor Fakkan', 'Kalba'],
        AJM: ['Ajman City', 'Masfout', 'Manama'],
        UAQ: ['Umm Al Quwain City', 'Falaj Al Mualla'],
        RAK: ['Ras Al Khaimah City', 'Al Rams', 'Al Jazirah Al Hamra'],
        FUJ: ['Fujairah City', 'Dibba Al-Fujairah', 'Al Badiyah'],
      };
      let sort = 1;
      for (const s of states) {
        const cities = cityMap[s.code] || [];
        for (const c of cities) {
          await queryInterface.bulkInsert('master_cities', [{
            id: Sequelize.literal('UUID()'), tenant_id: tenantId,
            state_id: s.id, country_id: aeId, name: c,
            is_system: true, is_active: true, sort_order: sort++,
            created_at: new Date(), updated_at: new Date(),
          }]);
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable('master_cities');
  },
};
