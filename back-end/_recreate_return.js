const service = require('./services/PurchaseReturnService');
const db = require('./config/database');

(async () => {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const userId = '00000000-0000-0000-0000-000000000001';
    const invoiceId = '80e1f329-acd4-4eec-b55a-5646eaf9f3db';

    // Only recreate if there are no returns for this invoice yet
    const [existing] = await db.query(
      "SELECT COUNT(*) c FROM purchasereturns WHERE purchase_invoice_id='" + invoiceId + "' AND deleted_at IS NULL"
    );
    if (existing[0].c > 0) {
      console.log('A return already exists for this invoice. Skipping.');
      process.exit(0);
    }

    const rb = await service.getReturnableLines(invoiceId, tenantId);
    const line = rb.lines[0];

    const created = await service.create(tenantId, {
      returnDate: '2026-08-14',
      referenceType: 'purchase_invoice',
      purchaseInvoiceId: invoiceId,
      notes: 'Sample invoice-based return',
      details: [{ purchaseInvoiceLineId: line.purchaseInvoiceLineId, itemId: line.itemId, quantity: 1 }]
    }, userId);

    console.log('Recreated:', created.returnNumber, created.status, created.totalAmount);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
