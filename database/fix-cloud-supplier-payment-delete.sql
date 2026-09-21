-- ============================================================
-- Cloud (Tezhost) DB patch — Supplier Payment delete fix
-- ============================================================
-- Root cause:
--   The deployed code now soft-deletes Journal Entries when a
--   Supplier Payment (or other posted document) is deleted.
--   That requires the columns below on `journal_entries` and
--   `journal_entry_lines`. If they are missing, the delete
--   transaction fails with:
--       "Unknown column 'deleted_at' in 'field list'"
--   and the whole payment delete rolls back.
--
-- Run this on the production database (ezeefloc_erp @ c28.eelserver.com)
-- BEFORE/WHEN deploying the new build. The statements are safe to run
-- once; if a column already exists, drop that single line.
-- ============================================================

-- 1) Soft-delete columns for Journal Entries
ALTER TABLE `journal_entries`
  ADD COLUMN `deleted_at` DATETIME NULL,
  ADD COLUMN `deleted_by` CHAR(36) NULL,
  ADD COLUMN `delete_reason` VARCHAR(255) NULL;

-- 2) Soft-delete columns for Journal Entry Lines
ALTER TABLE `journal_entry_lines`
  ADD COLUMN `deleted_at` DATETIME NULL,
  ADD COLUMN `deleted_by` CHAR(36) NULL;

-- 3) IMPORTANT — also recreate the General Ledger stored procedure so that
--    soft-deleted journal entries no longer appear in the GL report.
--    Run the full file:
--        database/stored-procedures/sp_Report_GeneralLedger.sql
--    (it contains DROP PROCEDURE IF EXISTS + CREATE PROCEDURE, and now
--     filters `je.deleted_at IS NULL` and `jel.deleted_at IS NULL`).

-- ============================================================
-- Optional verification queries
-- ============================================================
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'journal_entries'
--     AND COLUMN_NAME IN ('deleted_at','deleted_by','delete_reason');
--
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'journal_entry_lines'
--     AND COLUMN_NAME IN ('deleted_at','deleted_by');
-- ============================================================
