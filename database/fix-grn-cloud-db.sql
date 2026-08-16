-- ============================================================================
-- EzeeFlo ERP — Goods Receipt (GRN) cloud DB verify + create script
-- Run on the TEZHOST / production database (phpMyAdmin or MySQL CLI)
-- Idempotent — safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1 — VERIFY: do the GRN tables exist and have the right columns?
-- ---------------------------------------------------------------------------
SHOW TABLES LIKE 'goodsreceipts';
SHOW TABLES LIKE 'goodsreceiptdetails';

-- Must return the columns below. The app (Sequelize models) expects:
--   goodsreceipts:        id, tenant_id, grn_number, receipt_date,
--                         purchase_order_id, supplier_id, warehouse_id,
--                         reference, notes, status, total_quantity,
--                         created_by, updated_by, created_at, updated_at, deleted_at
--   goodsreceiptdetails:  id, goods_receipt_id, item_id, purchase_order_detail_id,
--                         description, ordered_quantity, received_quantity,
--                         unit_price, tax_percentage, discount_percentage,
--                         line_total, created_at, updated_at
SHOW COLUMNS FROM goodsreceipts;
SHOW COLUMNS FROM goodsreceiptdetails;

-- Related master tables the GRN flow depends on:
SHOW TABLES LIKE 'suppliers';
SHOW TABLES LIKE 'warehouses';
SHOW TABLES LIKE 'items';
SHOW TABLES LIKE 'purchaseorders';
SHOW TABLES LIKE 'purchaseorderdetails';


-- ---------------------------------------------------------------------------
-- SECTION 2 — CREATE goodsreceipts if it does not exist
-- (Correct schema. NOTE: purchase_order_id is NULLABLE so "Direct Receipt"
--  works without a PO.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goodsreceipts (
  `id`                CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id`         CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `grn_number`        VARCHAR(50)  NOT NULL,
  `receipt_date`      DATE         NOT NULL,
  `purchase_order_id` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `supplier_id`       CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `warehouse_id`      CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `reference`         VARCHAR(100) NULL,
  `notes`             TEXT         NULL,
  `status`            ENUM('draft','received','cancelled') DEFAULT 'draft',
  `total_quantity`    DECIMAL(18,4) DEFAULT 0.0000,
  `created_by`        CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `updated_by`        CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `created_at`        DATETIME NOT NULL,
  `updated_at`        DATETIME NOT NULL,
  `deleted_at`        DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ---------------------------------------------------------------------------
-- SECTION 3 — CREATE goodsreceiptdetails if it does not exist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goodsreceiptdetails (
  `id`                      CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `goods_receipt_id`        CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `item_id`                 CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `purchase_order_detail_id` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  `description`             VARCHAR(255) NULL,
  `ordered_quantity`        DECIMAL(18,4) DEFAULT 0.0000,
  `received_quantity`       DECIMAL(18,4) DEFAULT 0.0000,
  `unit_price`              DECIMAL(18,4) DEFAULT 0.0000,
  `tax_percentage`          DECIMAL(5,2)  DEFAULT 0.00,
  `discount_percentage`     DECIMAL(5,2)  DEFAULT 0.00,
  `line_total`              DECIMAL(18,4) DEFAULT 0.0000,
  `created_at`              DATETIME NOT NULL,
  `updated_at`              DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `goods_receipt_id` (`goods_receipt_id`),
  KEY `item_id` (`item_id`),
  KEY `purchase_order_detail_id` (`purchase_order_detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ---------------------------------------------------------------------------
-- SECTION 4 — FIX if goodsreceipts already exists but with the OLD/WRONG schema
-- ---------------------------------------------------------------------------
-- 4a. Direct GRN requires purchase_order_id to be nullable.
--     (An old schema may have it NOT NULL — this breaks "Direct Receipt".)
ALTER TABLE goodsreceipts
  MODIFY COLUMN purchase_order_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL;

-- 4b. Add any missing columns (MariaDB; for MySQL run each ADD COLUMN separately
--     and ignore "Duplicate column" errors).
ALTER TABLE goodsreceipts
  ADD COLUMN IF NOT EXISTS updated_by  CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  ADD COLUMN IF NOT EXISTS deleted_at  DATETIME NULL;

ALTER TABLE goodsreceiptdetails
  ADD COLUMN IF NOT EXISTS purchase_order_detail_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL;


-- ---------------------------------------------------------------------------
-- SECTION 5 — VERIFY AGAIN (run after the fixes)
-- ---------------------------------------------------------------------------
SHOW COLUMNS FROM goodsreceipts;
SHOW COLUMNS FROM goodsreceiptdetails;

-- purchase_order_id must show "Null: YES":
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'goodsreceipts'
  AND COLUMN_NAME IN ('purchase_order_id','supplier_id','warehouse_id','grn_number');


-- ============================================================================
-- NOTE: Foreign keys are intentionally omitted above (the app works without
-- them). Add them only if all referenced tables exist with matching collation:
--
-- ALTER TABLE goodsreceipts
--   ADD CONSTRAINT goodsreceipts_ibfk_1 FOREIGN KEY (tenant_id)
--     REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT goodsreceipts_ibfk_2 FOREIGN KEY (purchase_order_id)
--     REFERENCES purchaseorders(id) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT goodsreceipts_ibfk_3 FOREIGN KEY (supplier_id)
--     REFERENCES suppliers(id) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT goodsreceipts_ibfk_4 FOREIGN KEY (warehouse_id)
--     REFERENCES warehouses(id) ON DELETE SET NULL ON UPDATE CASCADE;
-- ============================================================================
