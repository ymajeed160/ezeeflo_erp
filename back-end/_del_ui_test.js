const db = require('./config/database');
(async () => {
  const [rows] = await db.query(
    "SELECT id, return_number FROM purchasereturns WHERE return_number='PRET-2026-00001'"
  );
  console.log(JSON.stringify(rows));
  if (rows.length) {
    const ids = rows.map(r => `'${r.id}'`).join(',');
    await db.query(`DELETE FROM purchasereturndetails WHERE purchase_return_id IN (${ids})`);
    await db.query(`DELETE FROM purchasereturns WHERE id IN (${ids})`);
    console.log('deleted', rows.length);
  }
  process.exit(0);
})();
