const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.query(
      "ALTER TABLE purchasereturndetails ADD COLUMN purchase_invoice_line_id CHAR(36) NULL"
    );
    console.log('ADDED purchase_invoice_line_id');
  } catch (e) {
    if (e.message && e.message.includes('Duplicate column')) {
      console.log('Column already exists');
    } else {
      console.log('ADD column error:', e.message);
    }
  }

  try {
    await sequelize.query(
      "ALTER TABLE purchasereturns MODIFY COLUMN status ENUM('draft','approved','rejected','posted','reversed') NOT NULL DEFAULT 'draft'"
    );
    console.log('ALTERED status enum');
  } catch (e) {
    console.log('ALTER enum error:', e.message);
  }

  process.exit(0);
})();
