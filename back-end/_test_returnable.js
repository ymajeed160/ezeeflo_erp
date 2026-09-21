const service = require('./services/PurchaseReturnService');
const tenantId = '4a9db942-8ba0-46c6-b534-6cbf8b1e5d9a'; // placeholder - will be discovered below
const db = require('./config/database');

(async () => {
  try {
    // Discover a tenant from an existing purchase invoice
    const [inv] = await db.query("SELECT tenant_id FROM purchaseinvoices WHERE id='80e1f329-acd4-4eec-b55a-5646eaf9f3db'");
    if (!inv.length) { console.log('invoice not found'); process.exit(0); }
    const tid = inv[0].tenant_id;
    console.log('tenant:', tid);
    const result = await service.getReturnableLines('80e1f329-acd4-4eec-b55a-5646eaf9f3db', tid);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
