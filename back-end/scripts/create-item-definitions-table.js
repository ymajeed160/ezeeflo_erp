// Create item_definitions table using main app config
const sequelize = require('../config/database');
const ItemDefinition = require('../models/ItemDefinition');

(async () => {
  try {
    await ItemDefinition.sync({ force: false });
    console.log('✅ item_definitions table created/verified successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
