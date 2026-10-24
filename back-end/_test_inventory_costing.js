'use strict';
/**
 * Integration test for the inventory weighted-average costing logic.
 *
 * Verifies that InventoryTransactionService.recordTransaction maintains
 * quantity_on_hand and average_cost correctly for stock inward/outward
 * movements. Runs inside a transaction and rolls back, so it never mutates
 * real data.
 *
 * Usage: node _test_inventory_costing.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const { sequelize, InventoryBalance, InventoryTransaction } = require('./models');
const InventoryTransactionService = require('./services/InventoryTransactionService');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
// Real warehouse/item IDs so the test satisfies foreign-key constraints.
// This item has no existing inventory balance, and the test rolls back, so
// no production data is affected.
const WAREHOUSE_ID = '5e87abc8-973c-4e73-8b25-e0860dd2a4cf';
const ITEM_ID = '66419527-c3eb-40e0-a165-2680cce64faa'; // EID Big Card Reader (no balance)

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

async function readBalance(t) {
  return InventoryBalance.findOne({
    where: { tenantId: TENANT_ID, itemId: ITEM_ID, warehouseId: WAREHOUSE_ID, variantId: null },
    transaction: t,
  });
}

async function record(t, quantity, unitCost) {
  await InventoryTransactionService.recordTransaction({
    tenantId: TENANT_ID,
    itemId: ITEM_ID,
    warehouseId: WAREHOUSE_ID,
    variantId: null,
    transactionType: quantity > 0 ? 'purchase' : 'sale',
    referenceId: 'test',
    referenceType: 'Test',
    referenceNumber: 'TEST-COSTING',
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
  }, t);
}

(async () => {
  console.log('Running inventory costing integration test...\n');
  const t = await sequelize.transaction();
  try {
    // 1. Inward 10 @ 100 -> avg 100, qty 10
    await record(t, 10, 100);
    let bal = await readBalance(t);
    assert(parseFloat(bal.quantityOnHand) === 10, 'inward 10 @ 100 sets quantity 10');
    assert(parseFloat(bal.averageCost) === 100, 'inward 10 @ 100 sets average cost 100');

    // 2. Inward 10 @ 50 -> avg 75, qty 20
    await record(t, 10, 50);
    bal = await readBalance(t);
    assert(parseFloat(bal.quantityOnHand) === 20, 'second inward sets quantity 20');
    assert(parseFloat(bal.averageCost) === 75, 'weighted average becomes 75');

    // 3. Outward 5 -> avg stays 75, qty 15
    await record(t, -5, 75);
    bal = await readBalance(t);
    assert(parseFloat(bal.quantityOnHand) === 15, 'outward reduces quantity to 15');
    assert(parseFloat(bal.averageCost) === 75, 'outward leaves average cost unchanged');

    // 4. Inward 5 @ 150 -> avg 93.75, qty 20
    await record(t, 5, 150);
    bal = await readBalance(t);
    assert(parseFloat(bal.quantityOnHand) === 20, 'final quantity 20');
    assert(parseFloat(bal.averageCost) === 93.75, 'final weighted average 93.75');

    console.log('\nAll inventory costing assertions passed.');
  } finally {
    await t.rollback();
    // Clean up the test transaction rows (rolled back automatically).
    await sequelize.close();
  }
})().catch(async (e) => {
  console.error(e.message);
  await sequelize.close();
  process.exit(1);
});
