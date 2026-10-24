'use strict';
/**
 * FIFO inventory costing acceptance tests (Test A–I from the specification).
 *
 * Runs entirely inside rolled-back transactions against the local dev DB, so
 * no production data is created or modified.
 *
 * Usage: node _test_fifo_costing.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const { sequelize } = require('./models');
const FifoCostService = require('./services/FifoCostService');
const SalesInvoiceService = require('./services/SalesInvoiceService');
const { v4: uuidv4 } = require('uuid');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const WAREHOUSE_ID = '5e87abc8-973c-4e73-8b25-e0860dd2a4cf';
// ASUS TUF product (inventory tracked) — real IDs from the dev chart of accounts.
const ITEM_ID = '4ad77b94-06c9-45b6-ac12-0156fefedb83';
const INVENTORY_ACCOUNT = 'a564b362-1b22-46cf-9a5f-71dcc1506190'; // 1300 Inventory
const COGS_ACCOUNT = '98358178-8d06-4fa8-bef6-cfe2463951be'; // 5100 Cost of Goods Sold

let passed = 0;
let failed = 0;
function check(cond, label) {
  if (cond) { passed += 1; console.log(`  PASS: ${label}`); }
  else { failed += 1; console.log(`  FAIL: ${label}`); }
}
function near(a, b, eps = 0.011) { return Math.abs(a - b) < eps; }

async function expectThrow(fn, label, matchText) {
  try { await fn(); failed += 1; console.log(`  FAIL: ${label} (expected error)`); }
  catch (e) {
    const msg = e.message || String(e);
    if (matchText && !msg.includes(matchText)) { failed += 1; console.log(`  FAIL: ${label} ("${msg}" missing "${matchText}")`); }
    else { passed += 1; console.log(`  PASS: ${label}`); }
  }
}

function makeItem() {
  return { id: ITEM_ID, name: 'ASUS TUF (test)', itemType: 'product', isInventoryTracked: true, expenseAccountId: COGS_ACCOUNT, inventoryAccountId: INVENTORY_ACCOUNT, incomeAccountId: '8009cd4c-db14-4aea-bc12-fc0b8cd80799', costPrice: 0 };
}
function makeInvoice(variantId) {
  return { id: uuidv4(), invoiceNumber: 'SINV-TEST', warehouseId: WAREHOUSE_ID };
}
function makeDetail(variantId, quantity) {
  return { id: uuidv4(), itemId: ITEM_ID, variantId, quantity };
}

(async () => {
  console.log('FIFO inventory costing tests\n');

  // ── Test A: FIFO sale (5@100 + 6@120, sell 6 → 5@100 + 1@120) ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 6, unitCost: 120, receiptDate: '2024-01-02' }, t);

      const allocations = await FifoCostService.consumeForSale({
        tenantId: TENANT_ID, detail: makeDetail(variantId, 6), item: makeItem(), invoice: makeInvoice(variantId), runningBalances: new Map(), transaction: t,
      });
      check(allocations.length === 2, 'Test A: two FIFO allocations produced');
      check(near(allocations[0].quantity, 5) && near(allocations[0].unitCost, 100), 'Test A: first allocation 5 @ 100');
      check(near(allocations[1].quantity, 1) && near(allocations[1].unitCost, 120), 'Test A: second allocation 1 @ 120');
      check(near(FifoCostService.sumAllocationCost(allocations), 620, 0.011), 'Test A: total COGS = 620');

      const peek = await FifoCostService.peekFifoCost(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, 0, t);
      check(near(peek.available, 5), 'Test A: remaining stock = 5');
      const peekVal = await FifoCostService.peekFifoCost(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, 5, t);
      check(near(peekVal.cost, 600, 0.011), 'Test A: remaining inventory value = 600');
    } finally { await t.rollback(); }
  }

  // ── Test B: full sales return (return all 6 → 5@100 + 1@120) ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 6, unitCost: 120, receiptDate: '2024-01-02' }, t);
      const detail = makeDetail(variantId, 6);
      const invoice = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail, item: makeItem(), invoice, runningBalances: new Map(), transaction: t });

      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, detail.id, t);
      const restored = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 6, {
        allocationType: 'return', referenceType: 'SalesReturn', referenceId: uuidv4(), referenceNumber: 'SR-TEST', referenceLineId: detail.id,
        itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, salesInvoiceId: invoice.id, salesInvoiceDetailId: detail.id,
      }, t);
      check(restored.length === 2, 'Test B: two restoration allocations produced');
      check(near(restored[0].quantity, 5) && near(restored[0].unitCost, 100), 'Test B: first restore 5 @ 100');
      check(near(restored[1].quantity, 1) && near(restored[1].unitCost, 120), 'Test B: second restore 1 @ 120');
      check(near(FifoCostService.sumAllocationCost(restored), 620, 0.011), 'Test B: restored value = 620');
      const peek = await FifoCostService.peekFifoCost(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, 0, t);
      check(near(peek.available, 11), 'Test B: stock restored to 11 units');
    } finally { await t.rollback(); }
  }

  // ── Test C: partial sales return (return 2 → 2@100) ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 6, unitCost: 120, receiptDate: '2024-01-02' }, t);
      const detail = makeDetail(variantId, 6);
      const invoice = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail, item: makeItem(), invoice, runningBalances: new Map(), transaction: t });

      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, detail.id, t);
      const restored = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 2, {
        allocationType: 'return', referenceType: 'SalesReturn', referenceId: uuidv4(), referenceNumber: 'SR-TEST', referenceLineId: detail.id,
        itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, salesInvoiceId: invoice.id, salesInvoiceDetailId: detail.id,
      }, t);
      check(restored.length === 1 && near(restored[0].quantity, 2) && near(restored[0].unitCost, 100), 'Test C: partial return restores 2 @ 100');
      check(near(FifoCostService.sumAllocationCost(restored), 200, 0.011), 'Test C: restored value = 200');
    } finally { await t.rollback(); }
  }

  // ── Test F: insufficient stock ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await expectThrow(
        () => FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail: makeDetail(variantId, 6), item: makeItem(), invoice: makeInvoice(variantId), runningBalances: new Map(), transaction: t }),
        'Test F: insufficient stock throws clear error', 'Insufficient stock'
      );
    } finally { await t.rollback(); }
  }

  // ── Test H: repeated restoration does not double-restore ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 6, unitCost: 120, receiptDate: '2024-01-02' }, t);
      const detail = makeDetail(variantId, 6);
      const invoice = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail, item: makeItem(), invoice, runningBalances: new Map(), transaction: t });
      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, detail.id, t);
      const ctx = { allocationType: 'return', referenceType: 'SalesReturn', referenceId: uuidv4(), referenceNumber: 'SR-TEST', referenceLineId: detail.id, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, salesInvoiceId: invoice.id, salesInvoiceDetailId: detail.id };
      const r1 = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 6, ctx, t);
      const r2 = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 6, ctx, t);
      check(near(FifoCostService.sumAllocationCost(r1), 620, 0.011), 'Test H: first restore = 620');
      check(r2.length === 0, 'Test H: second restore restores nothing (idempotent)');
    } finally { await t.rollback(); }
  }

  // ── Test E: cancellation after partial return does not double-restore ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 6, unitCost: 120, receiptDate: '2024-01-02' }, t);
      const detail = makeDetail(variantId, 6);
      const invoice = makeInvoice(variantId);
      await FifoCostService.consumeForSale({ tenantId: TENANT_ID, detail, item: makeItem(), invoice, runningBalances: new Map(), transaction: t });
      const saleAllocations = await FifoCostService.getSaleAllocations(TENANT_ID, detail.id, t);
      const retCtx = { allocationType: 'return', referenceType: 'SalesReturn', referenceId: uuidv4(), referenceNumber: 'SR-TEST', referenceLineId: detail.id, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, salesInvoiceId: invoice.id, salesInvoiceDetailId: detail.id };
      await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 2, retCtx, t); // partial return
      const cancelCtx = { ...retCtx, allocationType: 'cancel', referenceType: 'SalesInvoiceCancel', referenceNumber: 'SINV-TEST', referenceId: invoice.id };
      const cancelled = await FifoCostService.restoreAllocations(TENANT_ID, saleAllocations, 6, cancelCtx, t); // cancel remaining
      check(near(FifoCostService.sumAllocationCost(cancelled), 420, 0.011), 'Test E: cancellation restores only the remaining 4 @ value 420');
      const peek = await FifoCostService.peekFifoCost(TENANT_ID, ITEM_ID, WAREHOUSE_ID, variantId, 0, t);
      check(near(peek.available, 11), 'Test E: total stock back to 11 (no double restore)');
    } finally { await t.rollback(); }
  }

  // ── Test I: warehouse isolation ──
  {
    const t = await sequelize.transaction();
    try {
      const variantId = uuidv4();
      await FifoCostService.addLayer({ tenantId: TENANT_ID, itemId: ITEM_ID, variantId, warehouseId: WAREHOUSE_ID, sourceType: 'purchase', quantity: 5, unitCost: 100, receiptDate: '2024-01-01' }, t);
      const otherWarehouse = uuidv4();
      const availOther = await FifoCostService.getAvailableQuantity(TENANT_ID, ITEM_ID, otherWarehouse, variantId, t);
      check(near(availOther, 0), 'Test I: other warehouse sees zero FIFO stock');
    } finally { await t.rollback(); }
  }

  // ── Journal lines from FIFO allocations are balanced with correct COGS ──
  {
    const allocations = [{ totalCost: 500 }, { totalCost: 120 }];
    const allocationsByDetail = new Map();
    const detailId = uuidv4();
    allocationsByDetail.set(detailId, allocations);
    const invoice = {
      invoiceNumber: 'SINV-TEST',
      grandTotal: 1240,
      taxTotal: 0,
      customerAccountId: uuidv4(),
      warehouseId: WAREHOUSE_ID,
      details: [{ id: detailId, itemId: ITEM_ID, quantity: 6, unitPrice: 206.6667, discountPercent: 0, variantId: null, item: makeItem() }],
    };
    const lines = await SalesInvoiceService.buildJournalLines(TENANT_ID, invoice, allocationsByDetail);
    const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    check(near(totalDebit, totalCredit, 0.011), 'Journal: balanced from FIFO allocations');
    const cogsDebit = lines.filter((l) => l.accountId === COGS_ACCOUNT).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const invCredit = lines.filter((l) => l.accountId === INVENTORY_ACCOUNT).reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    check(near(cogsDebit, 620, 0.011), 'Journal: COGS debit = 620');
    check(near(invCredit, 620, 0.011), 'Journal: Inventory credit = 620');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await sequelize.close();
  process.exit(1);
});
