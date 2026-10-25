-- =============================================================================
-- Add manual stock-source allocation storage to sales_invoice_details.
--
-- When a user manually selects the stock source(s) (GRN / direct Purchase
-- Invoice) for a sales invoice line, the selection is persisted here as a JSON
-- array so the posting step re-applies exactly what the user chose:
--   [{ costLayerId, quantity, sourceNumber?, unitCost? }]
--
-- The authoritative per-layer cost record is still written to
-- `inventory_cost_allocations` at posting time; this column only carries the
-- pre-posting selection so it survives save/reopen and post-from-list.
--
-- Fully idempotent: the column is added only when it does not already exist.
-- Run in phpMyAdmin (select the ezeeflo database -> SQL tab -> paste -> Go),
-- same as the other files in this directory.
-- =============================================================================

-- sales_invoice_details --------------------------------------------------------
SET @t='sales_invoice_details', @c='manual_allocations'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` JSON NULL DEFAULT NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
