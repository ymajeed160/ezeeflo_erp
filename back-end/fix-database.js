const mysql = require('mysql2/promise');

async function fix() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'ezeefloc_proderp',
    password: 'Memits@396',
    database: 'erp_mt_suite'
  });

  console.log('Connected. Fixing database...');

  // 1. Drop old tables that cause FK issues
  await c.execute('SET FOREIGN_KEY_CHECKS = 0');

  const oldTables = [
    'customer_payment_allocations',
    'customer_payments',
    'credit_note_details',
    'credit_notes',
    'sales_return_details',
    'sales_returns',
    'sales_invoice_details',
    'sales_invoices',
    'delivery_note_details',
    'delivery_notes',
    'sales_order_details',
    'sales_orders'
  ];

  for (const table of oldTables) {
    try {
      await c.execute(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`Dropped table: ${table}`);
    } catch (err) {
      console.log(`Could not drop ${table}: ${err.message}`);
    }
  }

  // 2. Fix tenants table - drop duplicate UNIQUE indexes on subdomain
  // First find all indexes on tenants table
  const [indexes] = await c.execute(`SHOW INDEX FROM tenants WHERE Column_name = 'subdomain'`);
  console.log(`Found ${indexes.length} indexes on tenants.subdomain`);

  // Drop all unique indexes on subdomain EXCEPT the first one (keep one)
  // The index name pattern from Sequelize alter is like 'tenants_subdomain_unique'
  let kept = false;
  for (const idx of indexes) {
    if (idx.Key_name === 'PRIMARY') continue;
    if (!kept) {
      kept = true;
      console.log(`Keeping index: ${idx.Key_name}`);
      continue;
    }
    try {
      await c.execute(`ALTER TABLE tenants DROP INDEX \`${idx.Key_name}\``);
      console.log(`Dropped duplicate index: ${idx.Key_name}`);
    } catch (err) {
      console.log(`Could not drop index ${idx.Key_name}: ${err.message}`);
    }
  }

  // 3. Also check and fix other tables that may have too many indexes
  const tablesToCheck = ['users', 'accounts', 'journal_entries', 'roles', 'permissions'];
  for (const table of tablesToCheck) {
    const [tableIndexes] = await c.execute(`SHOW INDEX FROM \`${table}\``);
    if (tableIndexes.length > 20) {
      console.log(`WARNING: ${table} has ${tableIndexes.length} indexes - may need cleanup`);
    }
  }

  await c.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Database fix completed successfully');
  await c.end();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});