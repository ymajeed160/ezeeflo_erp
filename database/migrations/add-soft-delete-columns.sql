-- =============================================================================
-- Add soft-delete audit columns to production DB (TezHost / any MySQL 5.7+)
--
-- The deployed code references these columns, but they were added locally via
-- live ALTER and never applied to production:
--   Error: Unknown column 'PurchaseRequest.deleted_by' in 'SELECT'
--
-- How to run (TezHost):
--   STEP 1 (if you see "Table 'cash_payment_vouchers' doesn't exist"):
--     Run `create-cash-voucher-tables.sql` first — it creates the missing
--     cash_payment_vouchers / cash_receipt_vouchers tables (and already
--     includes the soft-delete columns on cash_payment_vouchers).
--   STEP 2:
--     Open phpMyAdmin -> select the ezeeflo database -> SQL tab ->
--     paste the ENTIRE file contents -> Go.
--
-- This script is FULLY IDEMPOTENT: each column is added only if it does not
-- already exist (checked via information_schema + PREPARE/EXECUTE), so it can
-- be re-run safely and never fails with "Duplicate column name".
-- Note: if a TABLE is missing, the affected lines report "Table doesn't exist";
-- create the table first (see STEP 1) and the lines become no-ops.
--
-- Column definitions (match the Sequelize models):
--   deleted_by     CHAR(36)        - UUID of the user who soft-deleted
--   delete_reason  VARCHAR(255)    - reason for soft delete
--   cancel_reason  VARCHAR(255)    - reason for cancel
--   deleted_at     DATETIME        - soft-delete timestamp (paranoid)
-- =============================================================================

-- quotations -------------------------------------------------------------------
SET @t='quotations', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='quotations', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='quotations', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- sales_orders -----------------------------------------------------------------
SET @t='sales_orders', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_orders', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_orders', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- purchase_requests ------------------------------------------------------------
SET @t='purchase_requests', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchase_requests', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchase_requests', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- purchaseorders ---------------------------------------------------------------
SET @t='purchaseorders', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchaseorders', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchaseorders', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- delivery_notes ---------------------------------------------------------------
SET @t='delivery_notes', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='delivery_notes', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='delivery_notes', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- goodsreceipts ----------------------------------------------------------------
SET @t='goodsreceipts', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='goodsreceipts', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='goodsreceipts', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- purchasereturns --------------------------------------------------------------
SET @t='purchasereturns', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchasereturns', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchasereturns', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- supplier_payments ------------------------------------------------------------
SET @t='supplier_payments', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='supplier_payments', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='supplier_payments', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- purchaseinvoices -------------------------------------------------------------
SET @t='purchaseinvoices', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchaseinvoices', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='purchaseinvoices', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- sales_invoices ---------------------------------------------------------------
SET @t='sales_invoices', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_invoices', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_invoices', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- sales_returns (also needs deleted_at - was non-paranoid) ---------------------
SET @t='sales_returns', @c='deleted_at'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` DATETIME NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_returns', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_returns', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='sales_returns', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- customer_payments (also needs deleted_at - was non-paranoid) -----------------
SET @t='customer_payments', @c='deleted_at'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` DATETIME NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='customer_payments', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='customer_payments', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='customer_payments', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- cash_payment_vouchers (also needs deleted_at - was non-paranoid) -------------
SET @t='cash_payment_vouchers', @c='deleted_at'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` DATETIME NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='cash_payment_vouchers', @c='deleted_by'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='cash_payment_vouchers', @c='delete_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
SET @t='cash_payment_vouchers', @c='cancel_reason'; SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` VARCHAR(255) NULL')); PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- Verification: run this after the ALTERs. It should list 13 tables.
-- SELECT TABLE_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY COLUMN_NAME) AS soft_delete_columns
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN (
--       'quotations','sales_orders','purchase_requests','purchaseorders',
--       'delivery_notes','goodsreceipts','purchasereturns','supplier_payments',
--       'purchaseinvoices','sales_invoices',
--       'sales_returns','customer_payments','cash_payment_vouchers'
--   )
--   AND COLUMN_NAME IN ('deleted_at','deleted_by','delete_reason','cancel_reason')
-- GROUP BY TABLE_NAME
-- ORDER BY TABLE_NAME;
