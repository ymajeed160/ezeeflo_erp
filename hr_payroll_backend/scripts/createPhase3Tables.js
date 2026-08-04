const sequelize = require('../config/database');
(async () => {
  await sequelize.authenticate();
  console.log('Connected');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id CHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT, price DECIMAL(10,2) DEFAULT 0,
      billing_cycle ENUM('monthly','quarterly','biannually','annually') DEFAULT 'annually',
      max_employees INT DEFAULT 50, max_users INT DEFAULT 10, max_branches INT DEFAULT 5,
      max_departments INT DEFAULT 10, max_payroll_runs INT DEFAULT 12,
      storage_limit_mb INT DEFAULT 1024, max_api_requests INT DEFAULT 10000,
      grace_period_days INT DEFAULT 15, enabled_modules JSON,
      is_active TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
      created_by CHAR(36), updated_by CHAR(36),
      created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('subscription_plans created');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS company_modules (
      id CHAR(36) PRIMARY KEY, company_id CHAR(36) NOT NULL, module_code VARCHAR(50) NOT NULL,
      module_name VARCHAR(100) NOT NULL, is_enabled TINYINT(1) DEFAULT 1,
      created_by CHAR(36), updated_by CHAR(36),
      created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME,
      UNIQUE KEY company_module (company_id, module_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('company_modules created');
  console.log('Done!');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
