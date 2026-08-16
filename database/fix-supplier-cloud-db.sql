-- ============================================================================
-- EzeeFlo ERP — Cloud DB repair script for Supplier creation
-- Run on the TEZHOST / production database (phpMyAdmin or MySQL CLI)
-- Every statement is idempotent — safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1 — DIAGNOSTICS (run first, check the output)
-- ---------------------------------------------------------------------------

-- 1a. Columns on suppliers (compare with local DB)
SHOW COLUMNS FROM suppliers;

-- 1b. Columns on audit_logs (must include: source, user_email, user_role,
--     module, entity_reference_number, request_id, session_id, status,
--     error_message, changed_fields, metadata)
SHOW COLUMNS FROM audit_logs;

-- 1c. Which supplier permissions are MISSING per tenant?
SELECT t.id AS tenant_id, pm.code
FROM tenants t
CROSS JOIN (
  SELECT 'supplier.view'   AS code UNION ALL
  SELECT 'supplier.create' UNION ALL
  SELECT 'supplier.edit'   UNION ALL
  SELECT 'supplier.delete'
) pm
LEFT JOIN permissions p ON p.tenant_id = t.id AND p.code = pm.code
WHERE p.id IS NULL;

-- 1d. Does the super_admin role have the supplier permissions?
SELECT r.tenant_id, r.name AS role_name, p.code
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id AND p.code LIKE 'supplier.%'
WHERE r.code = 'super_admin';


-- ---------------------------------------------------------------------------
-- SECTION 2 — FIX: ensure supplier.* permissions exist for ALL tenants
-- ---------------------------------------------------------------------------
INSERT INTO permissions
  (id, tenant_id, name, code, module, `group`, description, is_active,
   created_by, updated_by, created_at, updated_at)
SELECT UUID(), t.id, pm.name, pm.code, pm.module, pm.`group`, NULL, 1,
       NULL, NULL, NOW(), NOW()
FROM tenants t
CROSS JOIN (
  SELECT 'Suppliers - View'   AS name, 'supplier.view'   AS code, 'supplier' AS module, 'view'   AS `group`
  UNION ALL SELECT 'Suppliers - Create', 'supplier.create', 'supplier', 'create'
  UNION ALL SELECT 'Suppliers - Edit',   'supplier.edit',   'supplier', 'edit'
  UNION ALL SELECT 'Suppliers - Delete', 'supplier.delete', 'supplier', 'delete'
) pm
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.tenant_id = t.id AND p.code = pm.code
);


-- ---------------------------------------------------------------------------
-- SECTION 3 — FIX: assign supplier permissions to the super_admin role
-- (role_permissions has UNIQUE(role_id, permission_id), so INSERT IGNORE is safe)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO role_permissions
  (id, role_id, permission_id, tenant_id, created_at, updated_at)
SELECT UUID(), r.id, p.id, r.tenant_id, NOW(), NOW()
FROM roles r
JOIN permissions p
  ON p.tenant_id = r.tenant_id
 AND p.code IN ('supplier.view','supplier.create','supplier.edit','supplier.delete')
WHERE r.code = 'super_admin';

-- OPTIONAL: also grant supplier.create to another specific role (replace the
-- role code below with the role the affected user actually has, e.g. 'admin'):
-- INSERT IGNORE INTO role_permissions (id, role_id, permission_id, tenant_id, created_at, updated_at)
-- SELECT UUID(), r.id, p.id, r.tenant_id, NOW(), NOW()
-- FROM roles r
-- JOIN permissions p ON p.tenant_id = r.tenant_id AND p.code IN ('supplier.view','supplier.create','supplier.edit','supplier.delete')
-- WHERE r.code = 'admin';


-- ---------------------------------------------------------------------------
-- SECTION 4 — FIX: make sure suppliers table has all required columns
-- (MariaDB syntax with IF NOT EXISTS — see note below for plain MySQL)
-- ---------------------------------------------------------------------------
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS tax_number  VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS vat_number  VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS credit_days INT           DEFAULT 30,
  ADD COLUMN IF NOT EXISTS currency    VARCHAR(10)   DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS ap_account_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  ADD COLUMN IF NOT EXISTS is_active   TINYINT(1)    DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_at  DATETIME      NULL;

-- (FK on ap_account_id is optional for the app to work; added separately
--  only if you also want the constraint:
-- ALTER TABLE suppliers
--   ADD CONSTRAINT suppliers_ibfk_ap FOREIGN KEY (ap_account_id)
--   REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE;)


-- ---------------------------------------------------------------------------
-- SECTION 5 — FIX: make sure audit_logs has the columns added by the
-- 20260722000001-enhance-audit-logs migration (Supplier create writes here)
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_email              VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS user_role               VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS module                  VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS entity_reference_number VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS request_id              VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS session_id              VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS source ENUM('USER','SYSTEM','SCHEDULED_JOB','API','INTEGRATION')
                                                   NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS status                  VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS error_message           TEXT         NULL,
  ADD COLUMN IF NOT EXISTS changed_fields          JSON         NULL,
  ADD COLUMN IF NOT EXISTS metadata                JSON         NULL;


-- ---------------------------------------------------------------------------
-- SECTION 6 — VERIFY (run after the fixes)
-- ---------------------------------------------------------------------------
-- Should return ZERO rows (no missing supplier permissions):
SELECT t.id AS tenant_id, pm.code
FROM tenants t
CROSS JOIN (
  SELECT 'supplier.view'   AS code UNION ALL
  SELECT 'supplier.create' UNION ALL
  SELECT 'supplier.edit'   UNION ALL
  SELECT 'supplier.delete'
) pm
LEFT JOIN permissions p ON p.tenant_id = t.id AND p.code = pm.code
WHERE p.id IS NULL;

-- Should list supplier.view/create/edit/delete for every super_admin role:
SELECT r.tenant_id, p.code
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id AND p.code LIKE 'supplier.%'
WHERE r.code = 'super_admin'
ORDER BY r.tenant_id, p.code;


-- ============================================================================
-- NOTE ON MARIADB vs MYSQL
-- `ADD COLUMN IF NOT EXISTS` is MariaDB-only. If your cloud runs MySQL 5.7/8.0
-- (not MariaDB), split each ADD COLUMN into its own ALTER statement and ignore
-- "Duplicate column" errors for the columns that already exist.
-- Example for MySQL:
--   ALTER TABLE audit_logs ADD COLUMN source ENUM('USER','SYSTEM','SCHEDULED_JOB','API','INTEGRATION') NOT NULL DEFAULT 'USER';
-- ============================================================================
