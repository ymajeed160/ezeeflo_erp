const db = require('./config/database');
(async () => {
  const tid = '11111111-1111-1111-1111-111111111111';
  const [vat] = await db.query(
    "SELECT id, code, name, type FROM accounts WHERE tenant_id='" + tid + "' AND (name LIKE '%VAT%' OR name LIKE '%Tax%')"
  );
  console.log('VAT/Tax accounts:', JSON.stringify(vat, null, 2));
  const [liab] = await db.query(
    "SELECT id, code, name, type FROM accounts WHERE tenant_id='" + tid + "' AND type='liability'"
  );
  console.log('Liability accounts:', JSON.stringify(liab, null, 2));
  process.exit(0);
})();
