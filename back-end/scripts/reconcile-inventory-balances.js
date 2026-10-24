'use strict';
/**
 * Re-derive inventory_balances (quantityOnHand + averageCost) from the
 * authoritative FIFO inventory_cost_layers for every scope that has layers.
 *
 * inventory_balances is a fast-lookup projection of the cost layers. Use this
 * after fixing stock movements, or whenever a stale availability number is
 * suspected, to bring the projection back in line with the layers.
 *
 * Scopes with no cost layers are left untouched (legacy balances preserved).
 *
 * Usage:
 *   node scripts/reconcile-inventory-balances.js
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { sequelize, InventoryCostLayer } = require('../models');
const FifoCostService = require('../services/FifoCostService');

(async () => {
  const rows = await InventoryCostLayer.findAll({
    attributes: ['tenantId', 'itemId', 'warehouseId', 'variantId'],
    group: ['tenantId', 'itemId', 'warehouseId', 'variantId'],
    raw: true,
  });

  console.log(`Recomputing inventory_balances for ${rows.length} FIFO scope(s)...`);
  let updated = 0;

  for (const row of rows) {
    const { tenantId, itemId, warehouseId, variantId } = row;
    const res = await FifoCostService.recomputeBalance(tenantId, itemId, warehouseId, variantId || null);
    if (res && res.quantityOnHand !== null) {
      updated += 1;
      console.log(
        `  ${tenantId} | ${itemId} | ${warehouseId} | ${variantId || '-'} -> qty ${res.quantityOnHand}, avg ${res.averageCost}`
      );
    }
  }

  console.log(`Done. Updated ${updated} balance scope(s).`);
  await sequelize.close();
  process.exit(0);
})().catch(async (e) => {
  console.error(e);
  try { await sequelize.close(); } catch (_) { /* ignore */ }
  process.exit(1);
});
