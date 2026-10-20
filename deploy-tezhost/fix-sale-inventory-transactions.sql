-- =====================================================================
-- EzeeFlo ERP — repair sale inventory transactions recorded with
-- quantity_out = 0 (sales invoices posted with the old code).
-- Run ONCE in phpMyAdmin AFTER deploying the updated application.
-- =====================================================================

-- 1) Fill quantity_out / unit_cost from the invoice line
UPDATE inventory_transactions it
JOIN sales_invoice_details d
  ON d.sales_invoice_id = it.reference_id
 AND d.item_id = it.item_id
 AND ((d.variant_id IS NULL AND it.variant_id IS NULL) OR d.variant_id = it.variant_id)
SET it.quantity_out = d.quantity,
    it.unit_cost = COALESCE(NULLIF(d.cost_price, 0), it.unit_cost)
WHERE it.reference_type = 'SalesInvoice'
  AND it.transaction_type = 'sale'
  AND it.quantity_in = 0
  AND it.quantity_out = 0;

-- 2) Recompute running balances for every item/warehouse/variant
DROP TEMPORARY TABLE IF EXISTS _ef_running;
CREATE TEMPORARY TABLE _ef_running AS
SELECT id,
       SUM(quantity_in - quantity_out) OVER (
         PARTITION BY tenant_id, item_id, warehouse_id, variant_id
         ORDER BY transaction_date, id
       ) AS running_balance
FROM inventory_transactions;

UPDATE inventory_transactions it
JOIN _ef_running r ON r.id = it.id
SET it.running_balance = r.running_balance
WHERE it.running_balance <> r.running_balance;

DROP TEMPORARY TABLE IF EXISTS _ef_running;

-- 3) Verify
-- SELECT reference_type, transaction_type, quantity_in, quantity_out, running_balance
--   FROM inventory_transactions
--  WHERE reference_type = 'SalesInvoice'
--  ORDER BY transaction_date DESC LIMIT 20;
