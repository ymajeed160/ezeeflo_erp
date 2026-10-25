'use strict';
/* Generate a SQL backfill file (INSERT statements) for the FIFO cost layers
 * from the local ezeefloc_erp database. Used to apply the same backfill to the
 * production database via phpMyAdmin/mysql CLI.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB = 'ezeefloc_erp';

const LAYER_COLS = [
  'id', 'tenant_id', 'item_id', 'variant_id', 'warehouse_id',
  'source_type', 'source_id', 'source_line_id', 'stock_in_transaction_id',
  'received_quantity', 'remaining_quantity', 'unit_cost', 'original_value', 'remaining_value',
  'receipt_date', 'fifo_seq', 'created_at', 'updated_at',
];

const ALLOC_COLS = [
  'id', 'tenant_id', 'allocation_type', 'sales_invoice_id', 'sales_invoice_detail_id',
  'sales_return_id', 'sales_return_detail_id', 'item_id', 'variant_id', 'warehouse_id',
  'cost_layer_id', 'quantity', 'unit_cost', 'total_cost', 'stock_transaction_id',
  'reverses_allocation_id', 'created_at', 'updated_at',
];

function fmt(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function buildInsert(table, cols, rows) {
  const lines = [];
  for (const r of rows) {
    const vals = cols.map((c) => fmt(r[c])).join(', ');
    lines.push(`(${vals})`);
  }
  return `INSERT INTO \`${table}\` (\`${cols.join('` , `')}\`) VALUES\n${lines.join(',\n')};\n`;
}

(async () => {
  const c = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'Memits@396', database: DB, dateStrings: true,
  });

  const [layers] = await c.query(`SELECT * FROM inventory_cost_layers ORDER BY fifo_seq ASC`);
  const [allocs] = await c.query(`SELECT * FROM inventory_cost_allocations ORDER BY created_at ASC`);

  const parts = [];
  parts.push('-- FIFO cost layer backfill (generated from local ezeefloc_erp)');
  parts.push('-- Run on the PRODUCTION database after backing up.');
  parts.push(`-- Layers: ${layers.length}, Allocations: ${allocs.length}`);
  parts.push('');
  parts.push('SET FOREIGN_KEY_CHECKS = 0;');
  parts.push('');
  parts.push('DELETE FROM inventory_cost_allocations;');
  parts.push('DELETE FROM inventory_cost_layers;');
  parts.push('');

  if (layers.length) parts.push(buildInsert('inventory_cost_layers', LAYER_COLS, layers));
  if (allocs.length) parts.push(buildInsert('inventory_cost_allocations', ALLOC_COLS, allocs));

  parts.push('SET FOREIGN_KEY_CHECKS = 1;');

  const outPath = path.resolve(__dirname, '..', 'database', 'fifo-cost-layers-backfill.sql');
  fs.writeFileSync(outPath, parts.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`Layers: ${layers.length}, Allocations: ${allocs.length}`);

  await c.end();
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
