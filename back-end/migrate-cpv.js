const mysql = require('mysql2/promise');
const path = require('path');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'ezeefloc_proderp', password: 'Memits@396',
    database: 'erp_mt_suite', multipleStatements: true,
  });

  console.log('Creating CPV tables...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS cash_payment_vouchers (
      id CHAR(36) PRIMARY KEY,
      tenant_id CHAR(36) NOT NULL,
      branch_id CHAR(36) NULL,
      voucher_number VARCHAR(50) NOT NULL,
      voucher_date DATE NOT NULL,
      cash_account_id CHAR(36) NOT NULL,
      payee_type ENUM('supplier','employee','customer','other') DEFAULT 'other',
      payee_id CHAR(36) NULL,
      payee_name VARCHAR(200) NULL,
      reference_number VARCHAR(100) NULL,
      payment_method ENUM('cash','bank') DEFAULT 'cash',
      currency VARCHAR(10) DEFAULT 'AED',
      exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
      description TEXT NULL,
      subtotal DECIMAL(18,2) DEFAULT 0,
      tax_amount DECIMAL(18,2) DEFAULT 0,
      total_amount DECIMAL(18,2) DEFAULT 0,
      status ENUM('draft','submitted','approved','posted','cancelled','reversed') DEFAULT 'draft',
      journal_entry_id CHAR(36) NULL,
      is_deleted TINYINT(1) DEFAULT 0,
      created_by CHAR(36) NULL,
      updated_by CHAR(36) NULL,
      posted_by CHAR(36) NULL,
      posted_at DATETIME NULL,
      reversed_by CHAR(36) NULL,
      reversed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      INDEX idx_voucher_number (voucher_number),
      INDEX idx_status (status),
      INDEX idx_voucher_date (voucher_date),
      INDEX idx_cash_account (cash_account_id),
      INDEX idx_journal_entry (journal_entry_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS cash_payment_voucher_lines (
      id CHAR(36) PRIMARY KEY,
      voucher_id CHAR(36) NOT NULL,
      account_id CHAR(36) NOT NULL,
      description VARCHAR(255) NULL,
      amount DECIMAL(18,2) DEFAULT 0,
      tax_id CHAR(36) NULL,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(18,2) DEFAULT 0,
      total_amount DECIMAL(18,2) DEFAULT 0,
      cost_center_id CHAR(36) NULL,
      department_id CHAR(36) NULL,
      project_id CHAR(36) NULL,
      line_number INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_voucher (voucher_id),
      INDEX idx_account (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('CPV tables created successfully!');
  await conn.end();
})().catch(err => { console.error(err); process.exit(1); });
