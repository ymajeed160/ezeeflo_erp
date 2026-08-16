const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'c28.eelserver.com',
    user: 'ezeefloc_erp',
    password: 'Memits@396',
    database: 'ezeefloc_erp'
  });
  await c.execute('DROP TABLE IF EXISTS customer_payment_allocations');
  console.log('Dropped customer_payment_allocations');
  await c.end();
})();