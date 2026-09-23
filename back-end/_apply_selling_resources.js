'use strict';
/* One-off helper: apply Selling Resource schema changes to the LOCAL dev DB.
 * The local DB was created from a raw SQL dump (char(36) UUID columns, no
 * sequelize migration history), so we apply DDL directly instead of relying on
 * sequelize.sync()/sequelize-cli, which would generate CHAR(36) BINARY and
 * fail foreign-key type checks.
 */
require('dotenv').config();
const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

const statements = [
  `CREATE TABLE IF NOT EXISTS selling_resource_types (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS selling_resources (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS resource_income (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

(async () => {
  await sequelize.authenticate();
  console.log('DB connected:', process.env.DB_NAME);

  for (const stmt of statements) {
    await sequelize.query(stmt);
    console.log('Applied:', stmt.split('\n')[0].trim());
  }

  // Add sales_invoices.selling_resource_id if missing
  const cols = await sequelize.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_invoices' AND COLUMN_NAME = 'selling_resource_id'`,
    { type: QueryTypes.SELECT }
  );
  if (!cols.length) {
    await sequelize.query(`ALTER TABLE sales_invoices ADD COLUMN selling_resource_id CHAR(36) NULL`);
    console.log('Added sales_invoices.selling_resource_id');
  } else {
    console.log('sales_invoices.selling_resource_id already exists');
  }

  // Create the Resource Income report stored procedure
  const fs = require('fs');
  const path = require('path');
  const spPath = path.resolve(__dirname, '..', 'database', 'stored-procedures', 'sp_Report_ResourceIncome.sql');
  let raw = fs.readFileSync(spPath, 'utf8')
    .replace(/DELIMITER\s+\$\$/g, '')
    .replace(/DELIMITER\s+;/g, '')
    .replace(/\$\$/g, '');
  const dropIdx = raw.indexOf('CREATE PROCEDURE');
  const dropStmt = raw.slice(0, dropIdx).trim();
  const createStmt = raw.slice(dropIdx).trim();
  if (dropStmt) await sequelize.query(dropStmt);
  await sequelize.query(createStmt);
  console.log('Applied stored procedure sp_Report_ResourceIncome');

  console.log('DONE');
  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
