const db = require('./config/database');
(async () => {
  const [cols] = await db.query('SHOW COLUMNS FROM inventory_transactions');
  console.log(cols.map(c => c.Field).join(', '));
  process.exit(0);
})();
