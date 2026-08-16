-- ============================================================================
-- EzeeFlo ERP — Add specification fields to items table
-- Run this on PROD database
-- ============================================================================

ALTER TABLE items
  ADD COLUMN model VARCHAR(100) NULL AFTER description,
  ADD COLUMN size VARCHAR(50) NULL AFTER model,
  ADD COLUMN ram VARCHAR(50) NULL AFTER size,
  ADD COLUMN processor VARCHAR(100) NULL AFTER ram,
  ADD COLUMN ssd VARCHAR(50) NULL AFTER processor,
  ADD COLUMN generation VARCHAR(50) NULL AFTER ssd,
  ADD COLUMN colour VARCHAR(50) NULL AFTER generation;
