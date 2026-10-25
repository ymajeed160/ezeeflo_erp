'use strict';
/* Inspect the restored PROD database (ezeefloc_erp) on local MySQL and
 * compare its schema against the local dev database (erp_mt_suite).
 * Reports missing tables / missing columns that the app requires.
 */
const mysql = require('mysql2/promise');

const HOST = '127.0.0.1';
const USER = 'root';
const PASS = 'Memits@396';

async function listTables(conn, db) {
  const [rows] = await conn.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
    [db]
  );
  return rows.map((r) => r.TABLE_NAME);
}

async function listColumns(conn, db, table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
    [db, table]
  );
  return rows.map((r) => r.COLUMN_NAME);
}

(async () => {
  const conn = await mysql.createConnection({ host: HOST, user: USER, password: PASS });

  const [dbs] = await conn.query('SHOW DATABASES');
  const dbNames = dbs.map((d) => Object.values(d)[0]);
  console.log('DATABASES:', dbNames.join(', '));

  const prodDb = 'ezeefloc_erp';
  const devDb = 'erp_mt_suite';

  const prodTables = await listTables(conn, prodDb);
  const devTables = await listTables(conn, devDb);

  console.log(`\nPROD (${prodDb}) tables: ${prodTables.length}`);
  console.log(`DEV  (${devDb}) tables: ${devTables.length}`);

  const prodSet = new Set(prodTables);
  const devSet = new Set(devTables);

  const missingInProd = devTables.filter((t) => !prodSet.has(t));
  const extraInProd = prodTables.filter((t) => !devSet.has(t));

  console.log(`\nTables in DEV but MISSING in PROD (${missingInProd.length}):`);
  missingInProd.forEach((t) => console.log('  MISSING:', t));

  console.log(`\nTables only in PROD (${extraInProd.length}):`);
  extraInProd.forEach((t) => console.log('  extra:', t));

  // Key columns the recent features require
  const columnChecks = [
    ['sales_invoices', 'selling_resource_id'],
    ['sales_invoice_details', 'manual_allocations'],
    ['sales_invoice_details', 'variant_id'],
  ];
  console.log('\nColumn checks (PROD):');
  for (const [table, col] of columnChecks) {
    if (!prodSet.has(table)) {
      console.log(`  ${table}.${col}: TABLE MISSING`);
      continue;
    }
    const cols = await listColumns(conn, prodDb, table);
    console.log(`  ${table}.${col}: ${cols.includes(col) ? 'OK' : 'MISSING'}`);
  }

  // Show table counts for the new FIFO tables
  for (const t of ['inventory_cost_layers', 'inventory_cost_allocations']) {
    if (!prodSet.has(t)) {
      console.log(`  ${t}: TABLE MISSING`);
    } else {
      const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${prodDb}\`.\`${t}\``);
      console.log(`  ${t}: exists, rows=${rows[0].c}`);
    }
  }

  await conn.end();
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
