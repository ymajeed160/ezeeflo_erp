const DebitNoteService = require('./services/DebitNoteService');
const db = require('./config/database');

(async () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';
  const supplierId = '80559037-24ad-4fc9-b409-e8dabde65844'; // Jerome Holasca
  const purchaseReturnId = '27661024-410a-44d2-b80d-139bd5daf779'; // approved PRET-2026-00001

  try {
    const created = await DebitNoteService.create(tenantId, userId, {
      debitNoteDate: '2026-08-16',
      supplierId,
      purchaseReturnId,
      amount: 75.60,
      notes: 'Test debit note from return',
    });
    console.log('CREATED:', JSON.stringify({
      id: created.id,
      debitNoteNumber: created.debitNoteNumber,
      status: created.status,
      referenceType: created.referenceType,
      supplierId: created.supplierId,
      purchaseReturnId: created.purchaseReturnId,
      amount: created.amount,
    }));

    // Also test generateFromPurchaseReturn on another approved return (should pass or report duplicate)
    try {
      const g = await DebitNoteService.generateFromPurchaseReturn(tenantId, userId, purchaseReturnId);
      console.log('GENERATED:', g.debitNoteNumber, g.status);
    } catch (e) {
      console.log('generate-from-return:', e.message);
    }

    // Cleanup created test debit notes
    const [rows] = await db.query(
      "SELECT id FROM debit_notes WHERE tenant_id='" + tenantId + "' AND notes LIKE '%Test debit note from return%' OR notes LIKE '%Generated from Purchase Return%'"
    );
    if (rows.length) {
      const ids = rows.map(r => `'${r.id}'`).join(',');
      await db.query(`DELETE FROM debit_notes WHERE id IN (${ids})`);
      console.log('Deleted', rows.length, 'test debit notes');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
