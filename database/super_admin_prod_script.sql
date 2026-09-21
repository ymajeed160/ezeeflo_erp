-- ═══════════════════════════════════════════════════════════════
-- EzeeFlo Super Admin Portal — Production Database Script
-- Database: ezeeflo_hr_payroll
-- Date: 2026-08-01
-- ═══════════════════════════════════════════════════════════════

-- ══════════════════════════════════
-- 1. SUPER ADMINS TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `super_admins` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `profile_picture` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_locked` TINYINT(1) DEFAULT 0,
  `locked_at` DATETIME DEFAULT NULL,
  `login_attempts` INT DEFAULT 0,
  `last_login_at` DATETIME DEFAULT NULL,
  `last_login_ip` VARCHAR(45) DEFAULT NULL,
  `password_changed_at` DATETIME DEFAULT NULL,
  `must_change_password` TINYINT(1) DEFAULT 0,
  `refresh_token` VARCHAR(500) DEFAULT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `updated_by` CHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `idx_sa_username` (`username`),
  UNIQUE KEY `idx_sa_email` (`email`),
  KEY `idx_sa_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 2. SUPER ADMIN COMPANIES TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `super_admin_companies` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `legal_name` VARCHAR(300) DEFAULT NULL,
  `trade_license_number` VARCHAR(100) DEFAULT NULL,
  `tax_registration_number` VARCHAR(100) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `logo_url` VARCHAR(500) DEFAULT NULL,
  `timezone` VARCHAR(50) DEFAULT 'Asia/Dubai',
  `currency` VARCHAR(5) DEFAULT 'AED',
  `language` VARCHAR(10) DEFAULT 'en',
  `working_days` VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  `financial_year_start` VARCHAR(5) DEFAULT '01-01',
  `status` ENUM('active','inactive','suspended','expired','pending_activation','archived') DEFAULT 'pending_activation',
  `subscription_plan` VARCHAR(100) DEFAULT NULL,
  `subscription_start_date` DATE DEFAULT NULL,
  `subscription_expiry_date` DATE DEFAULT NULL,
  `max_employees` INT DEFAULT 50,
  `max_users` INT DEFAULT 10,
  `max_branches` INT DEFAULT 5,
  `max_departments` INT DEFAULT 10,
  `max_payroll_runs` INT DEFAULT 12,
  `storage_limit_mb` INT DEFAULT 1024,
  `max_api_requests` INT DEFAULT 10000,
  `grace_period_days` INT DEFAULT 15,
  `notes` TEXT DEFAULT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `updated_by` CHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  KEY `idx_sac_name` (`name`),
  KEY `idx_sac_email` (`email`),
  KEY `idx_sac_status` (`status`),
  KEY `idx_sac_expiry` (`subscription_expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 3. SUPER ADMIN LOGIN HISTORY TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `super_admin_login_history` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `super_admin_id` CHAR(36) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `login_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `logout_at` DATETIME DEFAULT NULL,
  `is_success` TINYINT(1) DEFAULT 1,
  `failure_reason` VARCHAR(255) DEFAULT NULL,
  `session_duration` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  KEY `idx_salh_admin` (`super_admin_id`),
  KEY `idx_salh_login` (`login_at`),
  KEY `idx_salh_success` (`is_success`),
  CONSTRAINT `fk_salh_admin` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 4. SUPER ADMIN AUDIT LOGS TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `super_admin_audit_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `super_admin_id` CHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) DEFAULT NULL,
  `entity_id` CHAR(36) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `old_values` JSON DEFAULT NULL,
  `new_values` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  KEY `idx_saal_admin` (`super_admin_id`),
  KEY `idx_saal_action` (`action`),
  KEY `idx_saal_entity` (`entity_type`, `entity_id`),
  KEY `idx_saal_created` (`created_at`),
  CONSTRAINT `fk_saal_admin` FOREIGN KEY (`super_admin_id`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 5. SUBSCRIPTION PLANS TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) DEFAULT 0,
  `billing_cycle` ENUM('monthly','quarterly','biannually','annually') DEFAULT 'annually',
  `max_employees` INT DEFAULT 50,
  `max_users` INT DEFAULT 10,
  `max_branches` INT DEFAULT 5,
  `max_departments` INT DEFAULT 10,
  `max_payroll_runs` INT DEFAULT 12,
  `storage_limit_mb` INT DEFAULT 1024,
  `max_api_requests` INT DEFAULT 10000,
  `grace_period_days` INT DEFAULT 15,
  `enabled_modules` JSON DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_by` CHAR(36) DEFAULT NULL,
  `updated_by` CHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `idx_sp_code` (`code`),
  KEY `idx_sp_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 6. COMPANY MODULES TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `company_modules` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `module_code` VARCHAR(50) NOT NULL,
  `module_name` VARCHAR(100) NOT NULL,
  `is_enabled` TINYINT(1) DEFAULT 1,
  `created_by` CHAR(36) DEFAULT NULL,
  `updated_by` CHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `idx_cm_company_module` (`company_id`, `module_code`),
  KEY `idx_cm_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════
-- 7. ANNOUNCEMENTS TABLE
-- ══════════════════════════════════
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(300) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('general','maintenance','feature','downtime','security','urgent') DEFAULT 'general',
  `priority` ENUM('low','normal','high','critical') DEFAULT 'normal',
  `target_companies` JSON DEFAULT NULL,
  `is_published` TINYINT(1) DEFAULT 0,
  `publish_at` DATETIME DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `updated_by` CHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  KEY `idx_ann_type` (`type`),
  KEY `idx_ann_published` (`is_published`),
  KEY `idx_ann_publish_at` (`publish_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════════
-- DEFAULT DATA SEED
-- ═══════════════════════════════════════════════════════════════

-- -- Default Super Admin (password: Admin@123, bcrypt hashed)
-- INSERT IGNORE INTO `super_admins` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `is_active`, `created_at`, `updated_at`)
-- VALUES (UUID(), 'superadmin', 'admin@ezeeflo.com', '$2a$12$LJ3m4ys3Lk0TSwHCpNqrBeX8KQ9JF5.BC1ShvWDZVnPZSzV1vqiTe', 'Super', 'Admin', '+971500000000', 1, NOW(), NOW());

-- Default Subscription Plans
INSERT IGNORE INTO `subscription_plans` (`id`, `name`, `code`, `price`, `billing_cycle`, `max_employees`, `max_users`, `max_branches`, `max_departments`, `max_payroll_runs`, `storage_limit_mb`, `max_api_requests`, `grace_period_days`, `enabled_modules`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES
(UUID(), 'Starter', 'starter', 0, 'annually', 25, 5, 3, 5, 12, 512, 5000, 7, 
 '["employees","attendance","leave","payroll","settings","master_data","security"]', 1, 1, NOW(), NOW()),
(UUID(), 'Professional', 'professional', 99, 'annually', 100, 20, 10, 20, 24, 2048, 20000, 15, 
 '["employees","attendance","leave","payroll","recruitment","training","reports","settings","master_data","security","benefits"]', 1, 2, NOW(), NOW()),
(UUID(), 'Enterprise', 'enterprise', 299, 'annually', 500, 100, 50, 100, 52, 10240, 100000, 30, 
 '["employees","attendance","leave","payroll","recruitment","training","performance","documents","reports","settings","master_data","security","ess","benefits"]', 1, 3, NOW(), NOW()),
(UUID(), 'Custom', 'custom', 0, 'annually', 50, 10, 5, 10, 12, 1024, 10000, 15, 
 '["employees","attendance","leave","payroll","recruitment","training","performance","documents","reports","settings","master_data","security","ess","benefits"]', 1, 99, NOW(), NOW());


-- ═══════════════════════════════════════════════════════════════
-- STORED PROCEDURES
-- ═══════════════════════════════════════════════════════════════

DELIMITER //

-- ── Get Super Admin Dashboard Stats ──
CREATE OR REPLACE PROCEDURE `sp_superadmin_dashboard`()
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `deleted_at` IS NULL) AS total_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'active' AND `deleted_at` IS NULL) AS active_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'inactive' AND `deleted_at` IS NULL) AS inactive_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'suspended' AND `deleted_at` IS NULL) AS suspended_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'expired' AND `deleted_at` IS NULL) AS expired_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'pending_activation' AND `deleted_at` IS NULL) AS pending_companies,
    (SELECT COUNT(*) FROM `super_admin_companies` WHERE `status` = 'active' AND `subscription_expiry_date` BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND `deleted_at` IS NULL) AS expiring_soon,
    (SELECT COUNT(*) FROM `users` WHERE `role` = 'employee' AND `deleted_at` IS NULL) AS total_employees,
    (SELECT COUNT(*) FROM `users` WHERE `role` = 'company_admin' AND `deleted_at` IS NULL) AS total_admins,
    (SELECT COUNT(*) FROM `users` WHERE `deleted_at` IS NULL) AS total_users,
    (SELECT COUNT(*) FROM `super_admins` WHERE `deleted_at` IS NULL) AS total_superadmins,
    (SELECT COUNT(*) FROM `super_admin_login_history` WHERE DATE(`login_at`) = CURDATE() AND `is_success` = 1) AS today_logins;
END //

-- ── Get Companies Expiring Soon ──
CREATE OR REPLACE PROCEDURE `sp_companies_expiring_soon`(IN days INT)
BEGIN
  SELECT `id`, `name`, `email`, `subscription_plan`, `subscription_expiry_date`, `status`
  FROM `super_admin_companies`
  WHERE `deleted_at` IS NULL
    AND `status` = 'active'
    AND `subscription_expiry_date` BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL days DAY)
  ORDER BY `subscription_expiry_date` ASC;
END //

-- ── Get Audit Logs by Date Range ──
CREATE OR REPLACE PROCEDURE `sp_audit_logs_by_date`(IN start_date DATE, IN end_date DATE)
BEGIN
  SELECT al.*, sa.username, sa.email
  FROM `super_admin_audit_logs` al
  LEFT JOIN `super_admins` sa ON al.`super_admin_id` = sa.`id`
  WHERE DATE(al.`created_at`) BETWEEN start_date AND end_date
  ORDER BY al.`created_at` DESC
  LIMIT 1000;
END //

-- ── Get Module Status for Company ──
CREATE OR REPLACE PROCEDURE `sp_company_modules`(IN company_id CHAR(36))
BEGIN
  SELECT 
    m.`module_code`,
    m.`module_name`,
    COALESCE(cm.`is_enabled`, 1) AS `is_enabled`
  FROM (
    SELECT 'employees' AS module_code, 'Employees' AS module_name UNION ALL
    SELECT 'attendance', 'Attendance' UNION ALL
    SELECT 'leave', 'Leave Management' UNION ALL
    SELECT 'payroll', 'Payroll' UNION ALL
    SELECT 'recruitment', 'Recruitment' UNION ALL
    SELECT 'training', 'Training' UNION ALL
    SELECT 'performance', 'Performance' UNION ALL
    SELECT 'documents', 'Documents' UNION ALL
    SELECT 'reports', 'Reports' UNION ALL
    SELECT 'settings', 'Settings' UNION ALL
    SELECT 'master_data', 'Master Data' UNION ALL
    SELECT 'security', 'Security' UNION ALL
    SELECT 'ess', 'Employee Self Service' UNION ALL
    SELECT 'benefits', 'Benefits & EOSB'
  ) m
  LEFT JOIN `company_modules` cm ON cm.`module_code` = m.`module_code` AND cm.`company_id` = company_id AND cm.`deleted_at` IS NULL;
END //

-- ── Get Company Admins with Details ──
CREATE OR REPLACE PROCEDURE `sp_company_admins`()
BEGIN
  SELECT 
    u.`id`, u.`username`, u.`email`, u.`first_name`, u.`last_name`, 
    u.`phone`, u.`is_active`, u.`is_locked`, u.`last_login_at`,
    sac.`id` AS company_id, sac.`name` AS company_name, sac.`status` AS company_status
  FROM `users` u
  LEFT JOIN `user_companies` uc ON uc.`user_id` = u.`id` AND uc.`deleted_at` IS NULL
  LEFT JOIN `super_admin_companies` sac ON sac.`id` = uc.`company_id` AND sac.`deleted_at` IS NULL
  WHERE u.`role` = 'company_admin' AND u.`deleted_at` IS NULL
  ORDER BY u.`created_at` DESC;
END //

-- ── Get Company Usage Report ──
CREATE OR REPLACE PROCEDURE `sp_company_usage_report`(IN company_id CHAR(36))
BEGIN
  SELECT 
    sac.`name` AS company_name,
    sac.`max_employees`,
    sac.`max_users`,
    sac.`storage_limit_mb`,
    (SELECT COUNT(*) FROM `users` u 
     LEFT JOIN `user_companies` uc ON uc.`user_id` = u.`id` AND uc.`deleted_at` IS NULL
     WHERE uc.`company_id` = company_id AND u.`deleted_at` IS NULL) AS current_users,
    (SELECT COUNT(*) FROM `employees` WHERE `deleted_at` IS NULL) AS current_employees,
    sac.`subscription_plan`,
    sac.`subscription_expiry_date`
  FROM `super_admin_companies` sac
  WHERE sac.`id` = company_id AND sac.`deleted_at` IS NULL;
END //

-- ── Get Published Announcements ──
CREATE OR REPLACE PROCEDURE `sp_published_announcements`()
BEGIN
  SELECT `id`, `title`, `content`, `type`, `priority`, `publish_at`, `created_at`
  FROM `announcements`
  WHERE `is_published` = 1 
    AND (`publish_at` IS NULL OR `publish_at` <= NOW())
    AND (`expires_at` IS NULL OR `expires_at` > NOW())
    AND `deleted_at` IS NULL
  ORDER BY 
    FIELD(`priority`, 'critical', 'high', 'normal', 'low'),
    `created_at` DESC
  LIMIT 20;
END //

-- ── Deactivate Expired Companies (for cron/scheduler) ──
CREATE OR REPLACE PROCEDURE `sp_deactivate_expired_companies`()
BEGIN
  UPDATE `super_admin_companies`
  SET `status` = 'expired', `updated_at` = NOW()
  WHERE `status` = 'active'
    AND `subscription_expiry_date` < CURDATE()
    AND `deleted_at` IS NULL;
    
  SELECT ROW_COUNT() AS companies_deactivated;
END //

DELIMITER ;


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check all tables created
-- SELECT TABLE_NAME FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = 'ezeeflo_hr_payroll' 
-- AND TABLE_NAME IN ('super_admins','super_admin_companies','super_admin_login_history','super_admin_audit_logs','subscription_plans','company_modules','announcements');

-- Check procedures created
-- SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
-- WHERE ROUTINE_SCHEMA = 'ezeeflo_hr_payroll' 
-- AND ROUTINE_NAME LIKE 'sp_%';
