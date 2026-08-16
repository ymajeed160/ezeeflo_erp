const m = require('mysql2/promise');
(async () => {
  const c = await m.createConnection({
    host: 'c28.eelserver.com', user: 'ezeefloc_erp',
    password: 'Memits@396', database: 'ezeefloc_erp',
    port: 3306, connectTimeout: 15000
  });

  console.log('=== AUDIT LOGS TABLE ===');
  const [count] = await c.query('SELECT COUNT(*) as cnt FROM audit_logs');
  console.log('Total records:', count[0].cnt);

  const [recent] = await c.query('SELECT id, action, entity, username, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5');
  console.log('Recent 5:', JSON.stringify(recent, null, 2));

  console.log('\n=== TABLE STRUCTURE ===');
  const [cols] = await c.query("SHOW COLUMNS FROM audit_logs");
  console.log('Columns:', cols.map(x => x.Field).join(', '));

  console.log('\n=== AUDIT PERMISSIONS ===');
  const [perms] = await c.query("SELECT code FROM permissions WHERE code LIKE 'audit.%'");
  if (perms.length === 0) {
    console.log('NO audit permissions found!');
  } else {
    console.log('Found:', perms.map(x => x.code).join(', '));
  }

  console.log('\n=== TENANTS ===');
  const [tenants] = await c.query('SELECT id, name FROM tenants');
  console.log(JSON.stringify(tenants.map(t => ({ id: t.id, name: t.name }))));

  await c.end();
})().catch(e => console.log('ERR:', e.code || e.message));
