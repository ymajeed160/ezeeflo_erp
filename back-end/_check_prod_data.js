'use strict';
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'Memits@396', database: 'ezeefloc_erp' });
  for (const t of ['goodsreceipts', 'purchase_invoices', 'sales_invoices']) {
    try {
      const [r] = await c.query(`SELECT COUNT(*) c FROM \`${t}\``);
      console.log(`${t}: ${r[0].c} rows`);
    } catch (e) { console.log(`${t}: ERROR ${e.message}`); }
  }
  console.log('\ninventory_transactions by type:');
  const [rows] = await c.query('SELECT transaction_type, COUNT(*) c, SUM(quantity_in) qty_in, SUM(quantity_out) qty_out FROM inventory_transactions GROUP BY transaction_type ORDER BY transaction_type');
  rows.forEach((r) => console.log(`  ${r.transaction_type}: count=${r.c}, in=${r.qty_in ?? 0}, out=${r.qty_out ?? 0}`));
  await c.end();
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
