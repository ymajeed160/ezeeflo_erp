'use strict';
/**
 * Regression tests: cancelled sales invoices must restore BOTH the FIFO layers
 * AND the inventory_balances projection used by stock-availability lookups.
 *
 * Runs entirely inside rolled-back transactions against the local dev DB.
 *
 * Usage: node _test_cancel_stock_restore.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const { sequelize, InventoryBalance, InventoryCostLayer, InventoryCostAllocation } = require('./models');
const FifoCostService = require('./services/FifoCostService');
const { v4: uuidv4 } = require('uuid');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const WAREHOUSE_ID = '5e87abc8-973c-4e73-8b25-e0860dd2a4cf';
const ITEM_ID = '4ad77b94-06c9-45b6-ac12-0156fefedb83'; // ASUS TUF product

let passed = 0;
let failed = 0;
function check(cond, label) {
  if (cond) { passed += 1; console.log(`  PASS: ${label}`); }
  else { failed += 1; console.log(`  FAIL: ${label}`); }
}
function near(a, b, eps = 0.011) { return Math.abs(a - b) < eps; }

function makeItem() {
  return {
    id: ITEM_ID, name: 'ASUS TUF (test)', itemType: 'product', isInventoryTracked: true,
    expenseAccountId: '98358178-8d06-4fa8-bef6-cfe2463951be',
    inventoryAccountId: 'a564b362-1b22-46cf-9a5f-71dcc1506190',
    incomeAccountId: '8009cd4c-db14-4aea-bc12-fc0b8cd80799',
    costPrice: 0,
  };
}
function makeInvoice(variantId, warehouseId = WAREHOUSE_ID) {
  return { id: uuidv4(), invoiceNumber: 'SINV-TEST', warehouseId };
}
function makeDetail(variantId, quantity) {
  return { id: uuidv4(), itemId: ITEM_ID, variantId, quantity };
}

async function balance(tenantId, itemId, warehouseId, variantId, t) {
  const row = await InventoryBalance.findOne({
    where: { tenantId, itemId, warehouseId, variantId },
    transaction: t,
  });
  return row ? parseFloat(row.quantityOnHand) || 0 : 0;
}

function saleCancelContext(detailId, invoice, variantId) {
  return {
    allocationType: 'cancel',
    referenceType: 'SalesInvoiceCancel',
    referenceId: invoice.id,
    referenceNumber: invoice.invoiceNumber,
    referenceLineId: detailId,
    itemId: ITEM_ID,
    variantId,
    warehouseId: invoice.warehouseId,
    salesInvoiceId: invoice.id,
    salesInvoiceDetailId: detailId,
  };
}

async function expectThrow(fn, label, matchText) {
  try { await fn(); failed += 1; console.log(`  FAIL: ${label} (expected error)`); }
  catch (e) {
    const msg = e.message || String(e);
    if (matchText && !msg.includes(matchText)) { failed += 1; console.log(`  FAIL: ${label} ("${msg}" missing "${matchText}")`); }
    else { passed += 1; console.log(`  PASS: ${label}`); }
  }
}

(async () => {
  console.log('Cancellation stock-restore regression tests\n');

  // ── Test A + D + F: sell 4 of 7, cancel → balance 7, idempotent, FIFO value intact ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 7, unitCost: 800, receiptDate: '2024-01-01' }, t);
      await FifoCostService.recomputeBalance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t);

      const detail = makeDetail(variantId, 4);
      const invoice = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail, item: makeItem(), invoice, runningBalances: new Map(), transaction: t });
      await FifoCostService.recomputeBalance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t);
      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 3), 'Test A: on-hand = 3 after sale of 4');

      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, detail.id, t);
      const restored = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 4, await saleCancelContext(detail.id, invoice, variantId), t);

      check(restored.length === 1 && near(restored[0].quantity, 4) && near(restored[0].unitCost, 800), 'Test A: cancellation restores 4 @ 800');
      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test A: on-hand = 7 after cancellation');
      check(near(await FifoCostService.getAvailableQuantity(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test A: FIFO available = 7 after cancellation');

      const layer = await InventoryCostLayer.findOne({ where: { tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID }, transaction: t });
      check(near(parseFloat(layer.remainingQuantity), 7) && near(parseFloat(layer.remainingValue), 5600, 0.011), 'Test F: restored layer qty=7, value=5600');

      // Duplicate cancellation (idempotent).
      const restored2 = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 4, await saleCancelContext(detail.id, invoice, variantId), t);
      check(restored2.length === 0, 'Test D: duplicate cancellation restores nothing');
      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test D: on-hand stays 7 after duplicate cancellation');
    } finally { await t.rollback(); }
  }

  // ── Test B: sell 5 after cancellation → allowed, on-hand 2 ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 7, unitCost: 800, receiptDate: '2024-01-01' }, t);

      const d1 = makeDetail(variantId, 4);
      const inv1 = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: d1, item: makeItem(), invoice: inv1, runningBalances: new Map(), transaction: t });
      await FifoCostService.restoreAllocations(TENANT_ID, await FifoCostService.getSaleAllocations(TENANT_ID, d1.id, t), 4, await saleCancelContext(d1.id, inv1, variantId), t);

      const d2 = makeDetail(variantId, 5);
      const inv2 = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: d2, item: makeItem(), invoice: inv2, runningBalances: new Map(), transaction: t });
      await FifoCostService.recomputeBalance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t);

      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 2), 'Test B: on-hand = 2 after selling 5 post-cancellation');
      check(near(await FifoCostService.getAvailableQuantity(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 2), 'Test B: FIFO available = 2');
    } finally { await t.rollback(); }
  }

  // ── Test C: attempt to sell 8 of 7 after cancellation → rejected, no movement ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 7, unitCost: 800, receiptDate: '2024-01-01' }, t);
      const d1 = makeDetail(variantId, 4);
      const inv1 = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: d1, item: makeItem(), invoice: inv1, runningBalances: new Map(), transaction: t });
      await FifoCostService.restoreAllocations(TENANT_ID, await FifoCostService.getSaleAllocations(TENANT_ID, d1.id, t), 4, await saleCancelContext(d1.id, inv1, variantId), t);

      await expectThrow(
        () => FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: makeDetail(variantId, 8), item: makeItem(), invoice: makeInvoice(variantId), runningBalances: new Map(), transaction: t }),
        'Test C: selling 8 of 7 is rejected', 'Insufficient stock'
      );
      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test C: on-hand unchanged (7) after rejected sale');
    } finally { await t.rollback(); }
  }

  // ── Test E: warehouse isolation ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      const otherWh = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 7, unitCost: 800, receiptDate: '2024-01-01' }, t);
      const d1 = makeDetail(variantId, 4);
      const inv1 = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: d1, item: makeItem(), invoice: inv1, runningBalances: new Map(), transaction: t });
      await FifoCostService.restoreAllocations(TENANT_ID, await FifoCostService.getSaleAllocations(TENANT_ID, d1.id, t), 4, await saleCancelContext(d1.id, inv1, variantId), t);

      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test E: restored stock available in original warehouse (7)');
      check(near(await balance(TENANT_ID, ITEM_ID, otherWh, variantId, t), 0), 'Test E: other warehouse remains at 0');
    } finally { await t.rollback(); }
  }

  // ── Test G: partial sales return then cancellation → no double restore ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 7, unitCost: 800, receiptDate: '2024-01-01' }, t);
      const d1 = makeDetail(variantId, 4);
      const inv1 = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: d1, item: makeItem(), invoice: inv1, runningBalances: new Map(), transaction: t });
      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, d1.id, t);

      // Partial return of 2.
      await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 2, {
        allocationType: 'return', referenceType: 'SalesReturn', referenceId: uuidv4(), referenceNumber: 'SR-TEST', referenceLineId: d1.id,
        itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, salesInvoiceId: inv1.id, salesInvoiceDetailId: d1.id,
      }, t);

      // Cancellation of the remaining 2 only.
      const cancelled = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 4, await saleCancelContext(d1.id, inv1, variantId), t);
      check(near(cancelled.reduce((s, r) => s + r.quantity, 0), 2), 'Test G: cancellation restores only the remaining 2 (no double restore)');
      check(near(await balance(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test G: on-hand = 7 after return + cancellation');
      check(near(await FifoCostService.getAvailableQuantity(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, t), 7), 'Test G: FIFO available = 7');
    } finally { await t.rollback(); }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
