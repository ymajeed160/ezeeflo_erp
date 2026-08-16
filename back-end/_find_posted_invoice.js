const db = require('./config/database');
(async () => {
  const [rows] = await db.query("SELECT id, invoice_number, status FROM purchaseinvoices WHERE status='posted' LIMIT 3");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
})();
