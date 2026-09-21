const db = require('./config/database');
(async () => {
  const [rows] = await db.query(
    "SELECT id, return_number, notes, status FROM purchasereturns WHERE notes='test invoice-based return' OR notes LIKE '%test%'"
  );
  console.log('Found test returns:', JSON.stringify(rows, null, 2));
  if (rows.length) {
    const ids = rows.map(r => `'${r.id}'`).join(',');
    await db.query(`DELETE FROM purchasereturndetails WHERE purchase_return_id IN (${ids})`);
    await db.query(`DELETE FROM purchasereturns WHERE id IN (${ids})`);
    console.log('Deleted', rows.length, 'test returns');
  }
  process.exit(0);
})();
