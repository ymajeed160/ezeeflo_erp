'use strict';
/**
 * Regression test for sales invoice cancellation / inventory reversal.
 *
 * Verifies that reverseInventoryImpact:
 *   1. Reverses stock using the original sale's recorded cost.
 *   2. Falls back to the valuation service when the ledger cost is zero.
 *   3. Is idempotent (a retry does not create a duplicate reversal).
 *
 * Runs inside a transaction and rolls back — no production data is mutated.
 *
 * Usage: node _test_invoice_cancellation.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const { sequelize, Item, InventoryTransaction, InventoryBalance } = require('./models');
const InventoryTransactionService = require('./services/InventoryTransactionService');
const SalesInvoiceService = require('./services/SalesInvoiceService');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const WAREHOUSE_ID = '5e87abc8-973c-4e73-8b25-e0860dd2a4cf';
const ASUS_ITEM_ID = '4ad77b94-06c9-45b6-ac12-0156fefedb83'; // costPrice 900

let passed = 0;
let failed = 0;
function check(condition, label) {
  if (condition) { passed += 1; console.log(`  PASS: ${label}`); }
  else { failed += 1; console.log(`  FAIL: ${label}`); }
}

async function recordSale(t, invoiceId, lineId, itemId, variantId, quantity, unitCost, warehouseId = WAREHOUSE_ID) {
  await InventoryTransactionService.recordTransaction({
    tenantId: TENANT_ID,
    itemId,
    variantId,
    warehouseId,
    transactionType: 'sale',
    referenceId: invoiceId,
    referenceType: 'SalesInvoice',
    referenceNumber: 'TEST-SALE',
    referenceLineId: lineId,
    quantity: -quantity,
    unitCost,
    totalCost: quantity * unitCost,
  }, t);
}

async function countReturns(t, invoiceId, warehouseId = WAREHOUSE_ID) {
  return InventoryTransaction.count({
    where: {
      tenantId: TENANT_ID,
      warehouseId,
      referenceId: invoiceId,
      transactionType: 'return',
      referenceType: 'SalesInvoiceCancel',
    },
    transaction: t,
  });
}

async function findReturn(t, invoiceId, warehouseId = WAREHOUSE_ID) {
  return InventoryTransaction.findOne({
    where: {
      tenantId: TENANT_ID,
      warehouseId,
      referenceId: invoiceId,
      transactionType: 'return',
      referenceType: 'SalesInvoiceCancel',
    },
    order: [['id', 'DESC']],
    transaction: t,
  });
}

(async () => {
  console.log('Sales invoice cancellation regression tests\n');
  const asus = await Item.findByPk(ASUS_ITEM_ID);
  const t = await sequelize.transaction();
  try {
    // --- Scenario A: sale recorded at 100, cancel must reverse at 100 ---
    const invA = 'aaaaaaaa-0000-0000-0000-000000000001';
    const lineA = 'aaaaaaaa-0000-0000-0000-0000000000a1';
    await recordSale(t, invA, lineA, ASUS_ITEM_ID, null, 5, 100);
    const invoiceA = {
      id: invA,
      invoiceNumber: 'TEST-CANCEL-A',
      warehouseId: WAREHOUSE_ID,
      details: [{ id: lineA, itemId: ASUS_ITEM_ID, quantity: 5, variantId: null, item: asus }],
    };
    await SalesInvoiceService.reverseInventoryImpact(TENANT_ID, invoiceA, 'u1', t);
    const revA = await findReturn(t, invA);
    check(revA !== null, 'cancellation creates a return transaction');
    check(parseFloat(revA.quantityIn) === 5, 'reversal restores the sold quantity (5)');
    check(parseFloat(revA.unitCost) === 100, 'reversal uses the original sale cost (100)');

    // Idempotency: calling again must not create a second reversal.
    await SalesInvoiceService.reverseInventoryImpact(TENANT_ID, invoiceA, 'u1', t);
    const returnsAfterRetry = await countReturns(t, invA);
    check(returnsAfterRetry === 1, 'cancellation retry does not create a duplicate reversal');

    // --- Scenario B: sale recorded at 0 (legacy), cancel must fall back to the
    // item cost (900). Uses a warehouse with no balance row for this item so the
    // valuation fallback resolves to the item master cost. ---
    const invB = 'bbbbbbbb-0000-0000-0000-000000000002';
    const lineB = 'bbbbbbbb-0000-0000-0000-0000000000b1';
    const whB = '32e153cc-6d77-4efa-a464-cbeecf70f38d';
    await recordSale(t, invB, lineB, ASUS_ITEM_ID, null, 2, 0, whB);
    const invoiceB = {
      id: invB,
      invoiceNumber: 'TEST-CANCEL-B',
      warehouseId: whB,
      details: [{ id: lineB, itemId: ASUS_ITEM_ID, quantity: 2, variantId: null, item: asus }],
    };
    await SalesInvoiceService.reverseInventoryImpact(TENANT_ID, invoiceB, 'u1', t);
    const revB = await findReturn(t, invB, whB);
    check(parseFloat(revB.unitCost) === 900, 'legacy zero-cost sale reverses using valuation fallback (900)');

    // --- Scenario C: mixed posting (unpost -> repost -> unpost) reverses each posting once ---
    const invC = 'cccccccc-0000-0000-0000-000000000003';
    const lineC = 'cccccccc-0000-0000-0000-0000000000c1';
    const invoiceC = {
      id: invC,
      invoiceNumber: 'TEST-CANCEL-C',
      warehouseId: WAREHOUSE_ID,
      details: [{ id: lineC, itemId: ASUS_ITEM_ID, quantity: 3, variantId: null, item: asus }],
    };
    await recordSale(t, invC, lineC, ASUS_ITEM_ID, null, 3, 100); // first posting
    await SalesInvoiceService.reverseInventoryImpact(TENANT_ID, invoiceC, 'u1', t); // first unpost
    await recordSale(t, invC, lineC, ASUS_ITEM_ID, null, 3, 100); // repost
    await SalesInvoiceService.reverseInventoryImpact(TENANT_ID, invoiceC, 'u1', t); // second unpost
    const returnsC = await countReturns(t, invC);
    check(returnsC === 2, 'unpost -> repost -> unpost creates exactly two reversals (one per posting)');

    console.log(`\n${passed} passed, ${failed} failed`);
  } finally {
    await t.rollback();
    await sequelize.close();
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await sequelize.close();
  process.exit(1);
});
