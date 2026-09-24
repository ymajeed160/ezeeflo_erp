-- ============================================================
-- Selling Resource feature — Cloud DB upgrade script
-- Target: ezeefloc_erp (Tezhost / c28.eelserver.com)
-- Idempotent — safe to re-run.
--
-- Contents:
--   1. Create selling_resource_types, selling_resources, resource_income
--   2. Add sales_invoices.selling_resource_id
--   3. Insert sellingresource.* / selling-resources.* permissions (all tenants)
--   4. Grant them to Admin + Super Admin roles (all tenants)
--   5. Create sp_Report_ResourceIncome stored procedure
-- ============================================================

-- ============================================================
-- 1) Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS selling_resource_types (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  type_name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_srtype_code_tenant (type_code, tenant_id),
  KEY idx_srtype_tenant_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS selling_resources (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  resource_code VARCHAR(50) NOT NULL,
  resource_name VARCHAR(200) NOT NULL,
  resource_type_id CHAR(36) NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_sellingresource_code_tenant (resource_code, tenant_id),
  KEY idx_sellingresource_type (resource_type_id),
  KEY idx_sellingresource_tenant_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resource_income (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  sales_invoice_id CHAR(36) NOT NULL,
  resource_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(50) NULL,
  invoice_date DATE NULL,
  customer_id CHAR(36) NULL,
  net_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  gross_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  income_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  status ENUM('posted','cancelled') NOT NULL DEFAULT 'posted',
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_resource_income_invoice_resource (sales_invoice_id, resource_id),
  KEY idx_resource_income_resource (resource_id),
  KEY idx_resource_income_tenant_date (tenant_id, invoice_date),
  KEY idx_resource_income_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2) sales_invoices.selling_resource_id
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_invoices'
    AND COLUMN_NAME = 'selling_resource_id'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE sales_invoices ADD COLUMN selling_resource_id CHAR(36) NULL',
  'SELECT ''sales_invoices.selling_resource_id already exists'''
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3) Permissions (all tenants)
-- ============================================================

INSERT INTO permissions
  (id, code, name, module, `group`, tenant_id, is_active, created_by, updated_by, created_at, updated_at)
SELECT
  UUID(), p.code, p.name, p.module, p.grp, t.id, 1, NULL, NULL, NOW(), NOW()
FROM tenants t
CROSS JOIN (
  SELECT 'sellingresource'     AS module, 'view'   AS grp, 'sellingresource.view'    AS code, 'Sellingresource - View'     AS name
  UNION ALL SELECT 'sellingresource', 'create', 'sellingresource.create', 'Sellingresource - Create'
  UNION ALL SELECT 'sellingresource', 'edit',   'sellingresource.edit',   'Sellingresource - Edit'
  UNION ALL SELECT 'sellingresource', 'delete', 'sellingresource.delete', 'Sellingresource - Delete'
  UNION ALL SELECT 'selling-resources', 'view',   'selling-resources.view',   'Selling Resources - View'
  UNION ALL SELECT 'selling-resources', 'create', 'selling-resources.create', 'Selling Resources - Create'
  UNION ALL SELECT 'selling-resources', 'edit',   'selling-resources.edit',   'Selling Resources - Edit'
  UNION ALL SELECT 'selling-resources', 'delete', 'selling-resources.delete', 'Selling Resources - Delete'
  UNION ALL SELECT 'selling-resources', 'report', 'selling-resources.report', 'Selling Resources - Report'
) p
WHERE NOT EXISTS (
  SELECT 1 FROM permissions pe
  WHERE pe.tenant_id = t.id AND pe.code = p.code
);

-- ============================================================
-- 4) Grant to Admin + Super Admin roles (all tenants)
-- ============================================================

INSERT INTO role_permissions
  (id, role_id, permission_id, tenant_id, created_by, updated_by, created_at, updated_at)
SELECT
  UUID(), r.id, pe.id, t.id, NULL, NULL, NOW(), NOW()
FROM roles r
INNER JOIN tenants t ON t.id = r.tenant_id
INNER JOIN permissions pe ON pe.tenant_id = t.id AND pe.code LIKE 'selling%'
WHERE LOWER(r.name) IN ('super admin', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = pe.id AND rp.tenant_id = t.id
  );

-- ============================================================
-- 5) Stored procedure: sp_Report_ResourceIncome
-- ============================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_ResourceIncome$$
CREATE PROCEDURE sp_Report_ResourceIncome(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_ResourceId CHAR(36), IN p_ResourceTypeId CHAR(36),
    IN p_CustomerId CHAR(36), IN p_InvoiceNumber VARCHAR(50),
    IN p_Status VARCHAR(20),
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_TotalRecords INT DEFAULT 0;

    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_resource_income;
    CREATE TEMPORARY TABLE tmp_resource_income AS
    SELECT
        ri.id,
        ri.sales_invoice_id,
        ri.resource_id,
        ri.invoice_number,
        ri.invoice_date,
        ri.customer_id,
        ri.net_amount,
        ri.tax_amount,
        ri.gross_amount,
        ri.income_amount,
        ri.status AS invoice_status,
        sr.resource_code,
        sr.resource_name,
        srt.id AS resource_type_id,
        srt.type_code,
        srt.type_name,
        c.name AS customer_name,
        COALESCE(c.currency, 'AED') AS currency
    FROM resource_income ri
    INNER JOIN selling_resources sr ON sr.id = ri.resource_id AND sr.tenant_id = p_TenantId
    LEFT JOIN selling_resource_types srt ON srt.id = sr.resource_type_id
    LEFT JOIN customers c ON c.id = ri.customer_id
    WHERE ri.tenant_id = p_TenantId
      AND (p_DateFrom IS NULL OR ri.invoice_date >= p_DateFrom)
      AND (p_DateTo IS NULL OR ri.invoice_date <= p_DateTo)
      AND (p_ResourceId IS NULL OR ri.resource_id = p_ResourceId)
      AND (p_ResourceTypeId IS NULL OR sr.resource_type_id = p_ResourceTypeId)
      AND (p_CustomerId IS NULL OR ri.customer_id = p_CustomerId)
      AND (p_InvoiceNumber IS NULL OR ri.invoice_number LIKE CONCAT('%', p_InvoiceNumber, '%'))
      AND (
            (p_Status IS NULL AND ri.status = 'posted')
            OR (p_Status = 'all')
            OR (ri.status = p_Status)
          );

    -- Result set 1: Summary totals
    SELECT
        COUNT(DISTINCT sales_invoice_id) AS total_invoices,
        COALESCE(SUM(net_amount), 0) AS total_net,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(gross_amount), 0) AS total_gross,
        COALESCE(SUM(gross_amount), 0) AS total_sales,
        COALESCE(SUM(income_amount), 0) AS total_income
    FROM tmp_resource_income;

    -- Result set 2: Detailed data
    SELECT
        resource_code,
        resource_name,
        COALESCE(type_code, '') AS resource_type_code,
        COALESCE(type_name, '') AS resource_type,
        invoice_number,
        invoice_date,
        COALESCE(customer_name, '') AS customer_name,
        net_amount,
        tax_amount,
        gross_amount,
        income_amount,
        currency,
        invoice_status
    FROM tmp_resource_income
    ORDER BY invoice_date DESC, invoice_number DESC
    LIMIT p_PageSize OFFSET v_Offset;

    -- Result set 3: Pagination metadata
    SELECT COUNT(*) INTO v_TotalRecords FROM tmp_resource_income;
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;

    DROP TEMPORARY TABLE tmp_resource_income;
END$$
DELIMITER ;

-- ============================================================
-- Verification (optional)
-- ============================================================
-- SELECT COUNT(*) AS permission_count FROM permissions WHERE code LIKE 'selling%';
-- SELECT COUNT(*) AS grant_count FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.code LIKE 'selling%';
-- SHOW PROCEDURE STATUS WHERE Name = 'sp_Report_ResourceIncome';
