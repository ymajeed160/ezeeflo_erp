-- =====================================================================
-- EzeeFlo ERP — Sales Invoice stock-source allocation column
-- Required by the COGS / Inventory costing fix: the stock source a user
-- selects on a Sales Invoice line (GRN / Purchase Invoice / returned stock)
-- is stored here so posting uses that source's own unit cost.
-- Run ONCE in phpMyAdmin (select the ERP database first).
-- Safe to re-run: it only adds the column when it is missing.
-- =====================================================================

SET @exists := (SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'sales_invoice_details'
                  AND column_name = 'manual_allocations');

SET @ddl := IF(@exists = 0,
  'ALTER TABLE `sales_invoice_details` ADD COLUMN `manual_allocations` JSON NULL',
  'DO 0');

PREPARE st FROM @ddl;
EXECUTE st;
DEALLOCATE PREPARE st;

-- Mark the migration as applied so `npx sequelize-cli db:migrate` does not
-- try to add the column a second time.
INSERT INTO SequelizeMeta (name)
SELECT '20261025000001-add-manual-allocations-to-sales-invoice-details.js'
WHERE EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema = DATABASE() AND table_name = 'SequelizeMeta')
  AND NOT EXISTS (SELECT 1 FROM SequelizeMeta
                  WHERE name = '20261025000001-add-manual-allocations-to-sales-invoice-details.js');
