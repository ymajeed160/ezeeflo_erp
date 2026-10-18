-- =====================================================================
-- EzeeFlo ERP — variant columns patch (for existing/deployed databases)
-- Run this once in phpMyAdmin on the deployed database.
-- Safe to re-run: each object is only created when it does not exist.
-- =====================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS ef_add_column_if_missing$$
CREATE PROCEDURE ef_add_column_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = tbl)
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col)
  THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

DROP PROCEDURE IF EXISTS ef_add_index_if_missing$$
CREATE PROCEDURE ef_add_index_if_missing(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN cols TEXT)
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = tbl)
     AND NOT EXISTS (SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = tbl AND index_name = idx)
  THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` (', cols, ')');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

DELIMITER ;

-- 1) Items: variant flags ------------------------------------------------
CALL ef_add_column_if_missing('items', 'is_variant_enabled', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL ef_add_column_if_missing('items', 'attribute_template_id', 'CHAR(36) NULL');

-- 2) Inventory -----------------------------------------------------------
CALL ef_add_column_if_missing('inventory_transactions', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('inventory_transactions', 'reference_line_id', 'CHAR(36) NULL');
CALL ef_add_index_if_missing('inventory_transactions', 'idx_inv_trans_variant', '`variant_id`');

CALL ef_add_column_if_missing('inventory_balances', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_index_if_missing('inventory_balances', 'idx_inventory_balances_variant', '`variant_id`');

-- 3) Purchase / Sales / Stock line tables --------------------------------
CALL ef_add_column_if_missing('purchase_request_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('purchase_request_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('purchase_request_details', 'idx_purchase_request_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('purchaseorderdetails', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('purchaseorderdetails', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('purchaseorderdetails', 'idx_purchaseorderdetails_variant', '`variant_id`');

CALL ef_add_column_if_missing('goodsreceiptdetails', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('goodsreceiptdetails', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('goodsreceiptdetails', 'idx_goodsreceiptdetails_variant', '`variant_id`');

CALL ef_add_column_if_missing('purchaseinvoicedetails', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('purchaseinvoicedetails', 'idx_purchaseinvoicedetails_variant', '`variant_id`');

CALL ef_add_column_if_missing('purchasereturndetails', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('purchasereturndetails', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('purchasereturndetails', 'idx_purchasereturndetails_variant', '`variant_id`');

CALL ef_add_column_if_missing('sales_order_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('sales_order_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('sales_order_details', 'idx_sales_order_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('delivery_note_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('delivery_note_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('delivery_note_details', 'idx_delivery_note_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('sales_invoice_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('sales_invoice_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('sales_invoice_details', 'idx_sales_invoice_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('sales_return_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('sales_return_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('sales_return_details', 'idx_sales_return_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('stock_adjustment_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('stock_adjustment_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('stock_adjustment_details', 'idx_stock_adjustment_details_variant', '`variant_id`');

CALL ef_add_column_if_missing('stock_transfer_details', 'variant_id', 'CHAR(36) NULL');
CALL ef_add_column_if_missing('stock_transfer_details', 'variant_description', 'VARCHAR(500) NULL');
CALL ef_add_index_if_missing('stock_transfer_details', 'idx_stock_transfer_details_variant', '`variant_id`');

-- 4) Cleanup ------------------------------------------------------------
DROP PROCEDURE IF EXISTS ef_add_column_if_missing;
DROP PROCEDURE IF EXISTS ef_add_index_if_missing;

-- Verify (should return the new columns):
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE table_schema = DATABASE() AND column_name IN ('variant_id','variant_description')
--  ORDER BY table_name;
