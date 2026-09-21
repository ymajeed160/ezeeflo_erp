const db = require('./config/database');
(async () => {
  const [rows] = await db.query("SELECT id, email FROM users LIMIT 3");
  console.log(JSON.stringify(rows));
  process.exit(0);
})();
