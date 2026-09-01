-- =============================================================================
-- Create missing Cash Payment Voucher / Cash Receipt Voucher tables on production
--
-- Error: Table 'ezeefloc_erp.cash_payment_vouchers' doesn't exist
--
-- These tables were created in the CPV/CRV module (migrations
-- 20260807000001-create-cash-payment-vouchers.js and
-- 20260807000002-create-cash-receipt-vouchers.js) but were never created on the
-- production DB (no-alter sync mode does NOT create missing tables when the DB
-- user lacks DDL privileges).
--
-- How to run (TezHost):
--   1. Open phpMyAdmin -> select the ezeeflo database.
--   2. SQL tab -> paste this entire file -> Go.
--
-- Uses CREATE TABLE IF NOT EXISTS, so it is safe to re-run.
-- The cash_payment_vouchers table already includes the soft-delete columns
-- (deleted_at/deleted_by/delete_reason/cancel_reason), so no further ALTER is
-- needed for it after this script.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Cash Payment Vouchers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_payment_vouchers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voucher_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voucher_date` date NOT NULL,
  `cash_account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payee_type` enum('supplier','employee','customer','other') COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `payee_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payee_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('cash','bank') COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `exchange_rate` decimal(10,4) DEFAULT '1.0000',
  `description` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(18,2) DEFAULT '0.00',
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `total_amount` decimal(18,2) DEFAULT '0.00',
  `status` enum('draft','submitted','approved','posted','cancelled','reversed') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `journal_entry_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posted_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `reversed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reversed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `delete_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_voucher_number` (`voucher_number`),
  KEY `idx_status` (`status`),
  KEY `idx_voucher_date` (`voucher_date`),
  KEY `idx_cash_account` (`cash_account_id`),
  KEY `idx_journal_entry` (`journal_entry_id`),
  CONSTRAINT `cash_payment_vouchers_ibfk_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cash_payment_voucher_lines` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `voucher_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT '0.00',
  `tax_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `total_amount` decimal(18,2) DEFAULT '0.00',
  `cost_center_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `line_number` int(11) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_voucher` (`voucher_id`),
  KEY `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cash Receipt Vouchers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_receipt_vouchers` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `branch_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `voucher_number` varchar(50) NOT NULL,
  `voucher_date` date NOT NULL,
  `cash_account_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `payer_type` enum('customer','supplier','employee','other') DEFAULT 'other',
  `payer_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `payer_name` varchar(200) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `payment_method` enum('cash','bank') DEFAULT 'cash',
  `currency` varchar(10) DEFAULT 'AED',
  `exchange_rate` decimal(10,4) DEFAULT '1.0000',
  `description` text,
  `subtotal` decimal(18,2) DEFAULT '0.00',
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `total_amount` decimal(18,2) DEFAULT '0.00',
  `allocated_amount` decimal(18,2) DEFAULT '0.00',
  `unallocated_amount` decimal(18,2) DEFAULT '0.00',
  `status` enum('draft','submitted','approved','posted','cancelled','reversed') DEFAULT 'draft',
  `journal_entry_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `posted_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `reversed_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `reversed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `posted_by` (`posted_by`),
  KEY `cash_receipt_vouchers_tenant_id` (`tenant_id`),
  KEY `cash_receipt_vouchers_voucher_number` (`voucher_number`),
  KEY `cash_receipt_vouchers_status` (`status`),
  KEY `cash_receipt_vouchers_voucher_date` (`voucher_date`),
  KEY `cash_receipt_vouchers_cash_account_id` (`cash_account_id`),
  KEY `cash_receipt_vouchers_journal_entry_id` (`journal_entry_id`),
  CONSTRAINT `cash_receipt_vouchers_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cash_receipt_vouchers_ibfk_2` FOREIGN KEY (`cash_account_id`) REFERENCES `accounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `cash_receipt_vouchers_ibfk_3` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `cash_receipt_vouchers_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `cash_receipt_vouchers_ibfk_5` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `cash_receipt_voucher_lines` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `account_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `party_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT '0.00',
  `tax_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `total_amount` decimal(18,2) DEFAULT '0.00',
  `cost_center_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `department_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `project_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `line_number` int(11) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_receipt_voucher_lines_voucher_id` (`voucher_id`),
  KEY `cash_receipt_voucher_lines_account_id` (`account_id`),
  CONSTRAINT `cash_receipt_voucher_lines_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `cash_receipt_vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cash_receipt_voucher_lines_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
