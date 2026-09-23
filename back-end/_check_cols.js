require('dotenv').config();
const s = require('./config/database');
const { QueryTypes } = require('sequelize');

(async () => {
  const rows = await s.query(
    "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'erp_mt_suite' AND TABLE_NAME IN ('tenants','suppliers','sales_invoices') AND COLUMN_NAME IN ('id','tenant_id','customer_id','selling_resource_id') ORDER BY TABLE_NAME, COLUMN_NAME",
    { type: QueryTypes.SELECT }
  );
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
