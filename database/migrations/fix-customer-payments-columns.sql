-- =============================================================================
-- Fix customer_payments columns on production (TezHost / any MySQL 5.7+)
--
-- Error: Unknown column 'CustomerPayment.bank_account_ref_id' in 'SELECT'
--
-- These columns/enum were added by migration 20260818000004-customer-payment-accounts.js
-- but never applied to production (no-alter sync does not alter existing tables).
--
-- Adds:
--   cash_account_id      CHAR(36)  - cash COA for 'cash' payment method
--   bank_account_ref_id  CHAR(36)  - FK -> bank_accounts(id) for bank/cheque/online
--   payment_method       ENUM extended with 'bank_transfer','online','credit_card','other'
--
-- Fully idempotent (checks information_schema before each change).
-- Run in phpMyAdmin -> select ezeeflo database -> SQL tab -> paste -> Go.
-- =============================================================================

-- 1. cash_account_id
SET @t='customer_payments', @c='cash_account_id';
SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) NULL'));
PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- 2. bank_account_ref_id (utf8_bin to match bank_accounts.id)
SET @t='customer_payments', @c='bank_account_ref_id';
SET @q=IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@t AND COLUMN_NAME=@c),'SELECT 1',CONCAT('ALTER TABLE `',@t,'` ADD COLUMN `',@c,'` CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL'));
PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;

-- 3. payment_method enum (MODIFY is always safe to re-run)
ALTER TABLE `customer_payments` MODIFY COLUMN `payment_method` ENUM('cash','bank_transfer','cheque','online','credit_card','other') NOT NULL DEFAULT 'bank_transfer';

-- 4. FK bank_account_ref_id -> bank_accounts(id) (only if not already present)
SET @fk = IF(EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='customer_payments' AND CONSTRAINT_NAME='customer_payments_ibfk_7'),'SELECT 1','ALTER TABLE `customer_payments` ADD CONSTRAINT `customer_payments_ibfk_7` FOREIGN KEY (`bank_account_ref_id`) REFERENCES `bank_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE');
PREPARE st FROM @fk; EXECUTE st; DEALLOCATE PREPARE st;

-- Verification (should show the new columns):
-- SHOW COLUMNS FROM `customer_payments`;
