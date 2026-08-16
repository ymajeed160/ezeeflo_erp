const service = require('./services/PurchaseReturnService');
const db = require('./config/database');

(async () => {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const userId = '00000000-0000-0000-0000-000000000001';

    const [rows] = await db.query(
      "SELECT id, return_number, status FROM purchasereturns WHERE tenant_id='" + tenantId + "' AND status='draft' AND deleted_at IS NULL"
    );
    if (!rows.length) { console.log('No draft return found'); process.exit(0); }

    const id = rows[0].id;
    console.log('Approving', rows[0].return_number);
    const result = await service.approve(id, tenantId, userId);
    console.log('APPROVED:', JSON.stringify({ id: result.id, returnNumber: result.returnNumber, status: result.status, totalAmount: result.totalAmount }));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
