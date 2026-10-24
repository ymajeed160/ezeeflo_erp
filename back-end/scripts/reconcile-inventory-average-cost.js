'use strict';
/**
 * Reconcile broken inventory_balances.average_cost values.
 *
 * Historical bug: inventory movements never maintained the weighted-average
 * per-unit cost, leaving quantity_on_hand > 0 with average_cost = 0. This
 * caused COGS/Inventory journal lines to be skipped or posted as zero.
 *
 * This script recomputes average_cost for every balance that has stock but no
 * cost, by replaying the item's inventory_transactions in chronological order
 * (weighted average), falling back to the item's configured cost price when
 * the ledger is inconclusive.
 *
 * It NEVER touches quantity_on_hand, transactions, journal entries, or any
 * other field. Run without arguments for a dry run; pass --apply to write.
 *
 * Usage: node scripts/reconcile-inventory-average-cost.js [--apply]
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { sequelize, InventoryBalance, InventoryTransaction, Item } = require('../models');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

async function replayAverage(tenantId, itemId, warehouseId, variantId) {
  const txs = await InventoryTransaction.findAll({
    where: { tenantId, itemId, warehouseId, variantId },
    order: [['transactionDate', 'ASC'], ['id', 'ASC']],
  });

  let qty = 0;
  let avg = 0;
  for (const tx of txs) {
    const qtyIn = parseFloat(tx.quantityIn) || 0;
    const qtyOut = parseFloat(tx.quantityOut) || 0;
    const unitCost = parseFloat(tx.unitCost) || 0;

    if (qtyIn > 0) {
      const incomingValue = qtyIn * unitCost;
      qty += qtyIn;
      if (qty > 0) avg = ((qty - qtyIn) * avg + incomingValue) / qty;
    } else if (qtyOut > 0) {
      qty = Math.max(0, qty - qtyOut);
    }
    // Transactions with zero movement (legacy bugs) are skipped.
  }
  return { avg: Math.round(avg * 10000) / 10000, replayedQty: qty };
}

(async () => {
  const broken = await InventoryBalance.findAll({
    where: { quantityOnHand: { [require('sequelize').Op.gt]: 0 }, averageCost: 0 },
    order: [['tenantId', 'ASC']],
  });

  console.log(`Found ${broken.length} balance row(s) with stock but zero average cost.\n`);
  if (broken.length === 0) {
    await sequelize.close();
    return;
  }

  const report = [];
  let updated = 0;

  for (const balance of broken) {
    const { avg, replayedQty } = await replayAverage(
      balance.tenantId, balance.itemId, balance.warehouseId, balance.variantId
    );

    let newAvg = avg;
    let source = 'transaction-replay';
    if (!newAvg || newAvg <= 0) {
      const item = await Item.findOne({ where: { id: balance.itemId, tenantId: balance.tenantId } });
      newAvg = item ? parseFloat(item.costPrice) || 0 : 0;
      source = 'item-cost-price-fallback';
    }

    const row = {
      tenantId: balance.tenantId,
      itemId: balance.itemId,
      warehouseId: balance.warehouseId,
      variantId: balance.variantId,
      quantityOnHand: parseFloat(balance.quantityOnHand),
      oldAverageCost: parseFloat(balance.averageCost),
      newAverageCost: newAvg,
      source,
      replayedQty,
      ledgerMatches: replayedQty === parseFloat(balance.quantityOnHand),
    };
    report.push(row);

    if (newAvg > 0) {
      if (APPLY) {
        await InventoryBalance.update(
          { averageCost: newAvg },
          { where: { id: balance.id } }
        );
        updated += 1;
      }
    }
    console.log(JSON.stringify(row));
  }

  const outFile = path.join(__dirname, '..', 'logs', `inventory-cost-reconcile-${Date.now()}.json`);
  try {
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
    console.log(`\nReport written to ${outFile}`);
  } catch (e) {
    console.log(`\nCould not write report file: ${e.message}`);
  }

  console.log(`\n${APPLY ? `Applied fixes to ${updated} row(s).` : `DRY RUN — ${report.filter((r) => r.newAverageCost > 0).length} row(s) would be updated. Re-run with --apply to write.`}`);
  await sequelize.close();
})().catch(async (e) => {
  console.error(e);
  await sequelize.close();
  process.exit(1);
});
