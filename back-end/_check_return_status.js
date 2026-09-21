const sequelize = require('./config/database');

(async () => {
  const [rows] = await sequelize.query("SELECT status, COUNT(*) c FROM purchasereturns GROUP BY status");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
})();
