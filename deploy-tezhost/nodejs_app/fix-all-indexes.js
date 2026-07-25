const mysql = require('mysql2/promise');

async function fix() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Memits@396',
    database: 'erp_mt_suite'
  });

  console.log('Connected. Fixing ALL duplicate indexes...');

  // Get all tables
  const [tables] = await c.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'erp_mt_suite'`
  );

  for (const { TABLE_NAME: table } of tables) {
    const [indexes] = await c.execute(`SHOW INDEX FROM \`${table}\``);
    
    // Group indexes by column name
    const columnIndexes = {};
    for (const idx of indexes) {
      if (idx.Key_name === 'PRIMARY') continue;
      const col = idx.Column_name;
      if (!columnIndexes[col]) columnIndexes[col] = [];
      if (!columnIndexes[col].includes(idx.Key_name)) {
        columnIndexes[col].push(idx.Key_name);
      }
    }

    // For each column, keep only the first index, drop duplicates
    for (const [col, names] of Object.entries(columnIndexes)) {
      if (names.length > 1) {
        // Keep the first one
        const [keep, ...drop] = names;
        console.log(`Table ${table}: Keeping ${keep} on ${col}, dropping ${drop.length} duplicates`);
        for (const name of drop) {
          try {
            await c.execute(`ALTER TABLE \`${table}\` DROP INDEX \`${name}\``);
          } catch (err) {
            console.log(`  Could not drop ${name}: ${err.message}`);
          }
        }
      }
    }
  }

  console.log('\nAll duplicate indexes cleaned up!');
  await c.end();
}

fix().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});