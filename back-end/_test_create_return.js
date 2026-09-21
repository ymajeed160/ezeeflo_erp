const service = require('./services/PurchaseReturnService');

(async () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';
  const invoiceId = '80e1f329-acd4-4eec-b55a-5646eaf9f3db';

  try {
    // First get returnable to find a line id
    const rb = await service.getReturnableLines(invoiceId, tenantId);
    const line = rb.lines[0];
    console.log('Using line:', line.purchaseInvoiceLineId, 'available:', line.availableQty);

    const created = await service.create(tenantId, {
      returnDate: '2026-08-14',
      referenceType: 'purchase_invoice',
      purchaseInvoiceId: invoiceId,
      notes: 'test invoice-based return',
      details: [
        { purchaseInvoiceLineId: line.purchaseInvoiceLineId, itemId: line.itemId, quantity: 2 }
      ]
    }, userId);

    console.log('CREATED:', JSON.stringify({
      id: created.id,
      returnNumber: created.returnNumber,
      supplierId: created.supplierId,
      warehouseId: created.warehouseId,
      status: created.status,
      totalAmount: created.totalAmount,
      details: created.details.map(d => ({ itemName: d.itemName, quantity: d.quantity, unitCost: d.unitCost, taxRate: d.taxRate, lineTotal: d.lineTotal, purchaseInvoiceLineId: d.purchaseInvoiceLineId }))
    }, null, 2));

    // Over-return check
    try {
      await service.create(tenantId, {
        returnDate: '2026-08-14',
        referenceType: 'purchase_invoice',
        purchaseInvoiceId: invoiceId,
        details: [{ purchaseInvoiceLineId: line.purchaseInvoiceLineId, itemId: line.itemId, quantity: 100 }]
      }, userId);
      console.log('ERROR: over-return was allowed!');
    } catch (e) {
      console.log('Over-return correctly rejected:', e.message);
    }

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
