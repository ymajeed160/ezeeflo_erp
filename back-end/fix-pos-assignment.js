const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'ezeefloc_proderp',
    password: 'Memits@396',
    database: 'erp_mt_suite'
  });

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const [terminals] = await conn.query('SELECT id, terminal_code, terminal_name FROM pos_terminals WHERE tenant_id = ?', [tenantId]);
  const [user] = await conn.query('SELECT id, username FROM users WHERE username = ?', ['yasir']);

  if (user.length > 0) {
    for (const t of terminals) {
      await conn.query(
        'INSERT IGNORE INTO pos_terminal_users (id, terminal_id, user_id, is_active, created_at, updated_at) VALUES (UUID(), ?, ?, 1, NOW(), NOW())',
        [t.id, user[0].id]
      );
      console.log('Assigned yasir to', t.terminal_name, '(' + t.terminal_code + ')');
    }
  } else {
    console.log('User yasir not found');
  }

  await conn.end();
  console.log('Done');
})().catch(err => console.error(err));
