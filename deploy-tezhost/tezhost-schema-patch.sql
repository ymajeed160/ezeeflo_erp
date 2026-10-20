-- =====================================================================
-- EzeeFlo ERP — schema drift patch (existing / deployed databases)
-- Aligns an older database with the current models.
-- Run ONCE in phpMyAdmin (select the ERP database first).
-- Safe to re-run: it only adds columns that are missing.
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

-- ---------------------------------------------------------------------
-- 1) Variant / attribute tables (created only if absent)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_attributes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100) NOT NULL,
  data_type ENUM('dropdown','text','number') NOT NULL DEFAULT 'dropdown',
  is_variant_defining TINYINT(1) NOT NULL DEFAULT 1,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_item_attr_code_tenant (tenant_id, code),
  KEY idx_item_attrs_tenant (tenant_id),
  KEY idx_item_attrs_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_attribute_options (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  attribute_id CHAR(36) NOT NULL,
  value VARCHAR(200) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_item_attr_options_attribute (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_attribute_templates (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_item_attr_tpl_code_tenant (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_attribute_template_attributes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  attribute_id CHAR(36) NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  is_variant_defining TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_template_attribute (template_id, attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_variants (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  configuration_key VARCHAR(255) NULL,
  description VARCHAR(500) NULL,
  cost_price DECIMAL(18,4) NULL DEFAULT 0,
  selling_price DECIMAL(18,4) NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY unique_item_variant_sku_tenant (tenant_id, sku),
  UNIQUE KEY unique_item_variant_config_tenant_item (tenant_id, item_id, configuration_key),
  KEY idx_item_variants_tenant (tenant_id),
  KEY idx_item_variants_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_variant_attribute_values (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  attribute_id CHAR(36) NOT NULL,
  option_id CHAR(36) NULL,
  value VARCHAR(500) NULL,
  display_value VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_item_var_attr_value (variant_id, attribute_id),
  KEY idx_item_var_attr_values_variant (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2) Missing columns on existing tables (from the current models)
-- ---------------------------------------------------------------------
CALL ef_add_column_if_missing('items', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('items', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'category_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'item_code', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('items', 'name', "VARCHAR(200) NULL");
CALL ef_add_column_if_missing('items', 'description', "TEXT NULL");
CALL ef_add_column_if_missing('items', 'model', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('items', 'size', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('items', 'ram', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('items', 'processor', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('items', 'ssd', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('items', 'generation', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('items', 'colour', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('items', 'item_type', "ENUM('product','service') NULL DEFAULT 'product'");
CALL ef_add_column_if_missing('items', 'unit_of_measure', "VARCHAR(50) NULL DEFAULT 'EA'");
CALL ef_add_column_if_missing('items', 'cost_price', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('items', 'selling_price', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('items', 'tax_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('items', 'is_inventory_tracked', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('items', 'is_variant_enabled', "TINYINT(1) NULL DEFAULT 0");
CALL ef_add_column_if_missing('items', 'attribute_template_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'income_account_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'expense_account_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'inventory_account_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'is_active', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('items', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('items', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('items', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_variants', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_variants', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variants', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variants', 'sku', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('item_variants', 'configuration_key', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('item_variants', 'description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('item_variants', 'cost_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_variants', 'selling_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_variants', 'is_active', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_variants', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variants', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variants', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_variants', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_variants', 'deleted_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attributes', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_attributes', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attributes', 'name', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('item_attributes', 'code', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('item_attributes', 'data_type', "ENUM('dropdown','text','number') NULL DEFAULT 'dropdown'");
CALL ef_add_column_if_missing('item_attributes', 'is_variant_defining', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_attributes', 'is_required', "TINYINT(1) NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_attributes', 'display_order', "INT NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_attributes', 'is_active', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_attributes', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attributes', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attributes', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attributes', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_options', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_attribute_options', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_options', 'attribute_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_options', 'value', "VARCHAR(200) NULL");
CALL ef_add_column_if_missing('item_attribute_options', 'display_order', "INT NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_attribute_options', 'is_active', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_attribute_options', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_options', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_attribute_templates', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'name', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'is_active', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_attribute_templates', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_templates', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'template_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'attribute_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'is_required', "TINYINT(1) NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'is_variant_defining', "TINYINT(1) NULL DEFAULT 1");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'display_order', "INT NULL DEFAULT 0");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_attribute_template_attributes', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'attribute_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'option_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'value', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'display_value', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('item_variant_attribute_values', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('inventory_transactions', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'warehouse_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'transaction_type', "ENUM('purchase','sale','adjustment','transfer_in','transfer_out','opening_balance','return','receipt','receipt_cancel') NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'reference_type', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'reference_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'reference_line_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_transactions', 'quantity_in', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_transactions', 'quantity_out', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_transactions', 'running_balance', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_transactions', 'unit_cost', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_transactions', 'transaction_date', "DATETIME NULL DEFAULT 'NOW'");
CALL ef_add_column_if_missing('inventory_balances', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('inventory_balances', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_balances', 'warehouse_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_balances', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_balances', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('inventory_balances', 'quantity_on_hand', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_balances', 'average_cost', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('inventory_balances', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('inventory_balances', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('sales_invoice_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'sales_invoice_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'delivery_note_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'sales_order_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'unit_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'tax_percent', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'discount_percent', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'line_total', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'cost_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_invoice_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_invoice_details', 'deleted_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_order_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('sales_order_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'sales_order_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'quotation_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('sales_order_details', 'quantity', "DECIMAL(15,3) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'delivered_quantity', "DECIMAL(15,3) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'invoiced_quantity', "DECIMAL(15,3) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'unit_price', "DECIMAL(15,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'tax_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'discount_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'line_total', "DECIMAL(15,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_order_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_order_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('delivery_note_details', 'delivery_note_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'sales_order_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'quantity', "DECIMAL(15,3) NULL DEFAULT 0");
CALL ef_add_column_if_missing('delivery_note_details', 'unit_price', "DECIMAL(15,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('delivery_note_details', 'tax_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('delivery_note_details', 'discount_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('delivery_note_details', 'total_amount', "DECIMAL(15,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('delivery_note_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('delivery_note_details', 'deleted_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_return_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('sales_return_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'sales_return_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'sales_invoice_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'unit_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'tax_percent', "DECIMAL(8,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'discount_percent', "DECIMAL(8,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'line_total', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'cost_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('sales_return_details', 'return_reason', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('sales_return_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('sales_return_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'purchase_invoice_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'unit_cost', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'tax_percent', "DECIMAL(8,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'tax_amount', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'discount_percent', "DECIMAL(8,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'discount_amount', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'line_total', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchaseinvoicedetails', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('purchaseorderdetails', 'purchase_order_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'received_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'unit_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'tax_percent', "DECIMAL(8,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'discount_percent', "DECIMAL(8,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'discount_amount', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'tax_amount', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'line_total', "DECIMAL(18,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'sort_order', "INT NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchaseorderdetails', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchaseorderdetails', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'goods_receipt_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'purchase_order_detail_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'ordered_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'received_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'unit_price', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'tax_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'discount_percentage', "DECIMAL(5,2) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'line_total', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('goodsreceiptdetails', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchase_requests', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('purchase_requests', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'request_number', "VARCHAR(50) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'request_date', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'requested_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'department', "VARCHAR(100) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'notes', "TEXT NULL");
CALL ef_add_column_if_missing('purchase_requests', 'status', "ENUM('draft','submitted','approved','rejected','converted') NULL DEFAULT 'draft'");
CALL ef_add_column_if_missing('purchase_requests', 'created_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'updated_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'deleted_by', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'delete_reason', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'cancel_reason', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('purchase_requests', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchase_requests', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchase_requests', 'deleted_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('purchase_request_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'purchase_request_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'description', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchase_request_details', 'required_date', "VARCHAR(255) NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'sort_order', "INT NULL DEFAULT 0");
CALL ef_add_column_if_missing('purchase_request_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('purchase_request_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('stock_adjustment_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'stock_adjustment_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'current_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_adjustment_details', 'adjusted_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_adjustment_details', 'difference_quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_adjustment_details', 'unit_cost', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_adjustment_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('stock_adjustment_details', 'updated_at', "DATETIME NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'id', "CHAR(36) NULL DEFAULT 'UUIDV4'");
CALL ef_add_column_if_missing('stock_transfer_details', 'tenant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'stock_transfer_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'item_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'variant_id', "CHAR(36) NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'variant_description', "VARCHAR(500) NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'quantity', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_transfer_details', 'unit_cost', "DECIMAL(18,4) NULL DEFAULT 0");
CALL ef_add_column_if_missing('stock_transfer_details', 'created_at', "DATETIME NULL");
CALL ef_add_column_if_missing('stock_transfer_details', 'updated_at', "DATETIME NULL");

-- ---------------------------------------------------------------------
-- 3) Indexes used by the application
-- ---------------------------------------------------------------------
CALL ef_add_index_if_missing('sales_invoice_details', 'idx_sales_invoice_details_variant', '`variant_id`');
CALL ef_add_index_if_missing('sales_order_details', 'idx_sales_order_details_variant', '`variant_id`');
CALL ef_add_index_if_missing('delivery_note_details', 'idx_delivery_note_details_variant', '`variant_id`');
CALL ef_add_index_if_missing('sales_return_details', 'idx_sales_return_details_variant', '`variant_id`');
CALL ef_add_index_if_missing('purchaseinvoicedetails', 'idx_purchaseinvoicedetails_variant', '`variant_id`');
CALL ef_add_index_if_missing('purchaseorderdetails', 'idx_purchaseorderdetails_variant', '`variant_id`');
CALL ef_add_index_if_missing('goodsreceiptdetails', 'idx_goodsreceiptdetails_variant', '`variant_id`');
CALL ef_add_index_if_missing('inventory_transactions', 'idx_inv_trans_variant', '`variant_id`');
CALL ef_add_index_if_missing('inventory_balances', 'idx_inventory_balances_variant', '`variant_id`');

DROP PROCEDURE IF EXISTS ef_add_column_if_missing;
DROP PROCEDURE IF EXISTS ef_add_index_if_missing;

-- Verify:
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE table_schema = DATABASE() AND column_name IN ('variant_id','variant_description','delivery_note_detail_id','sales_order_detail_id')
--  ORDER BY table_name;
