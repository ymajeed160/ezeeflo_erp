'use strict';
/**
 * Rebuild FIFO cost layers and per-sale cost allocations from the historical
 * inventory_transactions ledger.
 *
 * - Replays every (tenant, item, warehouse, variant) scope in chronological
 *   order: stock-inward movements create cost layers, stock-outward movements
 *   consume them oldest-first (FIFO).
 * - Reconstructs 'sale' allocations for SalesInvoice stock-outs so historical
 *   COGS/returns remain traceable.
 * - Compares the reconstructed layers against inventory_balances and reports
 *   any quantity/value differences.
 *
 * IDEMPOTENT: running with --apply clears the two FIFO tables and rebuilds
 * them deterministically from the ledger; it never touches inventory_balances,
 * inventory_transactions, or journal entries.
 *
 * Usage:
 *   node scripts/reconcile-inventory-cost-layers.js            (dry run)
 *   node scripts/reconcile-inventory-cost-layers.js --apply    (write)
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { sequelize, InventoryBalance, InventoryTransaction } = require('../models');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

const INWARD_TYPES = new Set(['purchase', 'receipt', 'adjustment', 'transfer_in', 'opening_balance', 'return']);
const OUTWARD_TYPES = new Set(['sale', 'transfer_out', 'receipt_cancel']);

const INWARD_SOURCE_TYPE = {
  purchase: 'purchase',
  receipt: 'receipt',
  adjustment: 'adjustment',
  transfer_in: 'transfer_in',
  opening_balance: 'opening_balance',
  return: 'return',
};

function rnd(v, d) {
  const f = Math.pow(10, d);
  return Math.round((parseFloat(v) || 0) * f) / f;
}

function scopeKey(r) {
  return `${r.tenantId}:${r.itemId}:${r.warehouseId}:${r.variantId || null}`;
}

async function replayScope(transactions) {
  const layers = []; // { id, received, remaining, unitCost, value, receiptDate, source... }
  const allocations = []; // sale allocations to persist
  const reportLines = [];

  for (const tx of transactions) {
    const qtyIn = rnd(tx.quantityIn, 4);
    const qtyOut = rnd(tx.quantityOut, 4);
    const unitCost = rnd(tx.unitCost, 6);
    const txDate = tx.transactionDate ? new Date(tx.transactionDate) : new Date();
    const receiptDate = txDate.toISOString().split('T')[0];

    if (qtyIn > 0 && INWARD_TYPES.has(tx.transactionType)) {
      const layer = {
        id: uuidv4(),
        tenantId: tx.tenantId,
        itemId: tx.itemId,
        variantId: tx.variantId || null,
        warehouseId: tx.warehouseId,
        sourceType: INWARD_SOURCE_TYPE[tx.transactionType] || 'purchase',
        sourceId: tx.referenceId || null,
        sourceLineId: tx.referenceLineId || null,
        stockInTransactionId: tx.id,
        receivedQuantity: qtyIn,
        remainingQuantity: qtyIn,
        unitCost,
        originalValue: rnd(qtyIn * unitCost, 6),
        remainingValue: rnd(qtyIn * unitCost, 6),
        receiptDate,
      };
      layers.push(layer);
    }

    if (qtyOut > 0 && OUTWARD_TYPES.has(tx.transactionType)) {
      let remaining = qtyOut;
      for (const layer of layers) {
        if (remaining <= 0) break;
        if (layer.remainingQuantity <= 0) continue;
        const take = Math.min(rnd(layer.remainingQuantity, 4), remaining);
        const cost = rnd(take * layer.unitCost, 6);
        layer.remainingQuantity = rnd(layer.remainingQuantity - take, 4);
        layer.remainingValue = rnd(layer.remainingValue - cost, 6);

        if (tx.transactionType === 'sale' && tx.referenceType === 'SalesInvoice') {
          allocations.push({
            id: uuidv4(),
            tenantId: tx.tenantId,
            allocationType: 'sale',
            salesInvoiceId: tx.referenceId || null,
            salesInvoiceDetailId: tx.referenceLineId || null,
            itemId: tx.itemId,
            variantId: tx.variantId || null,
            warehouseId: tx.warehouseId,
            costLayerId: layer.id,
            quantity: take,
            unitCost: layer.unitCost,
            totalCost: cost,
            // Historical transactions may span multiple layers, so a single
            // stock_transaction_id cannot be uniquely assigned to one
            // allocation; traceability is preserved via the invoice/line/layer.
            stockTransactionId: null,
          });
        }
        remaining = rnd(remaining - take, 4);
      }
      if (remaining > 0) {
        reportLines.push(`  ⚠ ${tx.transactionType}/${tx.referenceType || ''} ${tx.id} consumed ${rnd(qtyOut - remaining, 4)} but ${remaining} had no layer (possible legacy negative stock)`);
      }
    }
  }

  const availableQty = rnd(layers.reduce((s, l) => s + l.remainingQuantity, 0), 4);
  const availableValue = rnd(layers.reduce((s, l) => s + l.remainingValue, 0), 6);
  return { layers, allocations, availableQty, availableValue, reportLines };
}

(async () => {
  const txs = await InventoryTransaction.findAll({
    order: [['transaction_date', 'ASC'], ['id', 'ASC']],
    raw: true,
  });
  console.log(`Loaded ${txs.length} inventory transactions.`);

  const scopes = new Map();
  for (const tx of txs) {
    const key = scopeKey(tx);
    if (!scopes.has(key)) scopes.set(key, []);
    scopes.get(key).push(tx);
  }

  const balances = await InventoryBalance.findAll({ raw: true });
  const balanceByScope = new Map();
  for (const b of balances) {
    balanceByScope.set(`${b.tenantId}:${b.itemId}:${b.warehouseId}:${b.variantId || null}`, b);
  }

  const report = [];
  let totalLayers = 0;
  let totalAllocations = 0;

  for (const [key, scopeTxs] of scopes) {
    const { layers, allocations, availableQty, availableValue, reportLines } = await replayScope(scopeTxs);
    const balance = balanceByScope.get(key);
    const balQty = balance ? rnd(balance.quantityOnHand, 4) : 0;
    const balValue = balance ? rnd(rnd(balance.quantityOnHand, 4) * rnd(balance.averageCost, 4), 6) : 0;

    report.push({
      scope: key,
      transactions: scopeTxs.length,
      reconstructedQty: availableQty,
      reconstructedValue: availableValue,
      balanceQty: balQty,
      balanceValue: balValue,
      qtyDiff: rnd(availableQty - balQty, 4),
      valueDiff: rnd(availableValue - balValue, 2),
      layerCount: layers.length,
      notes: reportLines,
    });

    totalLayers += layers.length;
    totalAllocations += allocations.length;
  }

  console.log(`\nScopes: ${scopes.size}, reconstructed layers: ${totalLayers}, sale allocations: ${totalAllocations}`);
  console.log('Reconciliation report:');
  for (const r of report) {
    console.log(`  ${r.scope}  qty=${r.reconstructedQty} (bal ${r.balanceQty}, diff ${r.qtyDiff})  value=${r.reconstructedValue} (bal ${r.balanceValue}, diff ${r.valueDiff})  layers=${r.layerCount}`);
    for (const n of r.notes) console.log(n);
  }

  const mismatches = report.filter((r) => Math.abs(r.qtyDiff) > 0.0001 || Math.abs(r.valueDiff) > 0.01);
  console.log(`\n${mismatches.length} scope(s) with quantity/value differences vs inventory_balances.`);

  const outFile = path.join(__dirname, '..', 'logs', `fifo-layer-reconcile-${Date.now()}.json`);
  try {
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
    console.log(`Report written to ${outFile}`);
  } catch (e) {
    console.log(`Could not write report file: ${e.message}`);
  }

  if (APPLY) {
    const t = await sequelize.transaction();
    try {
      await sequelize.query('DELETE FROM inventory_cost_allocations', { transaction: t });
      await sequelize.query('DELETE FROM inventory_cost_layers', { transaction: t });

      for (const [key, scopeTxs] of scopes) {
        const { layers, allocations } = await replayScope(scopeTxs);
        if (layers.length) {
          await sequelize.models.InventoryCostLayer.bulkCreate(layers, { transaction: t });
        }
        if (allocations.length) {
          await sequelize.models.InventoryCostAllocation.bulkCreate(allocations, { transaction: t });
        }
      }
      await t.commit();
      console.log(`\nAPPLIED — rebuilt ${totalLayers} layer(s) and ${totalAllocations} allocation(s).`);
    } catch (e) {
      await t.rollback();
      console.error('Apply failed:', e.message);
      if (e.errors) {
        for (const err of e.errors) {
          console.error('  -', err.path || err.type, ':', err.message);
        }
      }
    }
  } else {
    console.log(`\nDRY RUN — re-run with --apply to write the reconstructed layers.`);
  }

  await sequelize.close();
  process.exit(0);
})().catch(async (e) => {
  console.error(e);
  await sequelize.close();
  process.exit(1);
});
