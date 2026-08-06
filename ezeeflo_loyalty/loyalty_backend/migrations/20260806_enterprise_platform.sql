-- Migration: Phase 1-5 Enterprise Loyalty Platform
-- Run against ezeeflo_loyalty database
-- Generated: 2026-08-06

-- ==================== Loyalty Rules ====================
CREATE TABLE IF NOT EXISTS `loyalty_rules` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `rule_type` ENUM('earn','redeem','bonus','tier_upgrade','tier_downgrade','expiry') NOT NULL,
  `priority` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,
  `conditions` JSON NULL,
  `actions` JSON NULL,
  `applicable_stores` JSON NULL,
  `applicable_branches` JSON NULL,
  `target_segments` JSON NULL,
  `max_applications` INT NULL,
  `max_applications_per_customer` INT NULL,
  `application_count` INT DEFAULT 0,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Customer Segments ====================
CREATE TABLE IF NOT EXISTS `customer_segments` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `segment_type` ENUM('dynamic','static','ai_generated') DEFAULT 'dynamic',
  `filters` JSON NULL,
  `customer_ids` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `refresh_interval` INT DEFAULT 1440,
  `last_refreshed_at` DATETIME NULL,
  `customer_count` INT DEFAULT 0,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Marketing Workflows ====================
CREATE TABLE IF NOT EXISTS `marketing_workflows` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `trigger_type` ENUM('inactive_days','birthday','anniversary','first_purchase','nth_purchase','tier_upgrade','points_expiring','high_spend','low_activity','campaign_join','referral_complete','custom') NOT NULL,
  `trigger_config` JSON NULL,
  `steps` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `target_segments` JSON NULL,
  `execution_count` INT DEFAULT 0,
  `last_executed_at` DATETIME NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Stores ====================
CREATE TABLE IF NOT EXISTS `stores` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `store_type` ENUM('main','branch','franchise','kiosk','popup','warehouse') DEFAULT 'branch',
  `region` VARCHAR(100) NULL,
  `country` VARCHAR(100) DEFAULT 'UAE',
  `city` VARCHAR(100) NULL,
  `address` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(150) NULL,
  `manager_name` VARCHAR(200) NULL,
  `timezone` VARCHAR(50) DEFAULT 'Asia/Dubai',
  `opening_hours` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `parent_store_id` CHAR(36) NULL,
  `store_group` VARCHAR(100) NULL,
  `settings` JSON NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_store_id`) REFERENCES `stores`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Badges ====================
CREATE TABLE IF NOT EXISTS `badges` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `badge_type` ENUM('achievement','streak','challenge','milestone','special','referral') DEFAULT 'achievement',
  `icon` VARCHAR(255) NULL,
  `color` VARCHAR(20) NULL,
  `criteria` JSON NULL,
  `points_reward` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Customer Badges ====================
CREATE TABLE IF NOT EXISTS `customer_badges` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `badge_id` CHAR(36) NOT NULL,
  `earned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `progress` INT DEFAULT 0,
  `progress_target` INT DEFAULT 100,
  `is_completed` TINYINT(1) DEFAULT 0,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Customer Streaks ====================
CREATE TABLE IF NOT EXISTS `customer_streaks` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `streak_type` ENUM('daily_login','daily_purchase','weekly_purchase','referral','review') NOT NULL,
  `current_streak` INT DEFAULT 0,
  `longest_streak` INT DEFAULT 0,
  `last_activity_date` DATE NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Fraud Rules ====================
CREATE TABLE IF NOT EXISTS `fraud_rules` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `fraud_type` ENUM('duplicate_account','suspicious_redemption','abnormal_accumulation','rule_abuse','multiple_devices','rapid_transactions','geo_anomaly','amount_anomaly') NOT NULL,
  `severity` ENUM('low','medium','high','critical') DEFAULT 'medium',
  `conditions` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `auto_block` TINYINT(1) DEFAULT 0,
  `notification_channels` JSON NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Fraud Alerts ====================
CREATE TABLE IF NOT EXISTS `fraud_alerts` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `fraud_rule_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NULL,
  `severity` ENUM('low','medium','high','critical') DEFAULT 'medium',
  `title` VARCHAR(300) NOT NULL,
  `description` TEXT,
  `evidence` JSON NULL,
  `status` ENUM('open','investigating','resolved','dismissed') DEFAULT 'open',
  `resolved_by` CHAR(36) NULL,
  `resolved_at` DATETIME NULL,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fraud_rule_id`) REFERENCES `fraud_rules`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Webhooks ====================
CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` CHAR(36) PRIMARY KEY,
  `company_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `events` JSON NOT NULL,
  `secret` VARCHAR(200) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `retry_count` INT DEFAULT 3,
  `success_count` INT DEFAULT 0,
  `failure_count` INT DEFAULT 0,
  `last_triggered_at` DATETIME NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== Webhook Logs ====================
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` CHAR(36) PRIMARY KEY,
  `webhook_id` CHAR(36) NOT NULL,
  `event` VARCHAR(100) NOT NULL,
  `payload` JSON NULL,
  `status` ENUM('success','failed','pending','retrying') DEFAULT 'pending',
  `status_code` INT NULL,
  `response_body` TEXT,
  `attempt_count` INT DEFAULT 1,
  `error_message` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
