const db = require('./config/database');
(async () => {
  const [c] = await db.query("SHOW COLUMNS FROM purchasereturndetails LIKE 'purchase_invoice_line_id'");
  const [e] = await db.query("SHOW COLUMNS FROM purchasereturns LIKE 'status'");
  console.log('purchasereturndetails.purchase_invoice_line_id:', JSON.stringify(c));
  console.log('purchasereturns.status type:', e[0] ? e[0].Type : 'NOT FOUND');
  process.exit(0);
})();
