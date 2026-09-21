-- ============================================================
-- EzeeFlo Loyalty - MySQL Database Schema (Phase 1)
-- SaaS Multi-Tenant Loyalty Management Platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS ezeeflo_loyalty
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ezeeflo_loyalty;

-- ============================================================
-- SUPER ADMIN & PLATFORM MANAGEMENT
-- ============================================================

-- Subscription Plans
CREATE TABLE subscription_plans (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  billing_cycle ENUM('monthly','quarterly','biannual','annual') NOT NULL DEFAULT 'monthly',
  max_companies INT NOT NULL DEFAULT 1,
  max_users INT NOT NULL DEFAULT 5,
  max_customers INT NOT NULL DEFAULT 100,
  max_api_calls INT NOT NULL DEFAULT 1000,
  storage_limit_mb INT NOT NULL DEFAULT 100,
  features JSON,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_plans_active (is_active),
  INDEX idx_plans_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription Modules (features that can be toggled per plan)
CREATE TABLE subscription_modules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  status ENUM('enabled','disabled','hidden','beta') NOT NULL DEFAULT 'enabled',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_modules_status (status),
  INDEX idx_modules_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan-Module junction
CREATE TABLE subscription_plan_modules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  plan_id CHAR(36) NOT NULL,
  module_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES subscription_modules(id) ON DELETE CASCADE,
  UNIQUE KEY uq_plan_module (plan_id, module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMPANIES (Tenants)
-- ============================================================
CREATE TABLE companies (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150),
  phone VARCHAR(30),
  website VARCHAR(255),
  logo VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'UAE',
  postal_code VARCHAR(20),
  currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT 'د.إ',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Dubai',
  status ENUM('active','inactive','suspended','trial','deleted') NOT NULL DEFAULT 'trial',
  trial_start_date DATE,
  trial_end_date DATE,
  max_users INT NOT NULL DEFAULT 5,
  max_customers INT NOT NULL DEFAULT 100,
  settings JSON,
  branding JSON,
  subscription_status ENUM('active','past_due','canceled','expired','trialing') DEFAULT 'trialing',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_companies_status (status),
  INDEX idx_companies_code (code),
  INDEX idx_companies_subscription (subscription_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Subscriptions
CREATE TABLE company_subscriptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  billing_cycle ENUM('monthly','quarterly','biannual','annual') NOT NULL DEFAULT 'monthly',
  status ENUM('active','past_due','canceled','expired','trialing') NOT NULL DEFAULT 'active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 1,
  trial_days INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_cs_company (company_id),
  INDEX idx_cs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Subscription Modules
CREATE TABLE company_subscription_modules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_subscription_id CHAR(36) NOT NULL,
  module_id CHAR(36) NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_subscription_id) REFERENCES company_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES subscription_modules(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cs_module (company_subscription_id, module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Licenses
CREATE TABLE licenses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  license_key VARCHAR(255) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  grace_period_days INT NOT NULL DEFAULT 7,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_licenses_company (company_id),
  INDEX idx_licenses_key (license_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USERS, ROLES & PERMISSIONS (RBAC)
-- ============================================================
CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(30),
  avatar VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
  last_login DATETIME,
  last_password_change DATETIME,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  refresh_token VARCHAR(500),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_users_company (company_id),
  INDEX idx_users_email (email),
  INDEX idx_users_super_admin (is_super_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id),
  INDEX idx_rt_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles
CREATE TABLE roles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_company_code (company_id, code),
  INDEX idx_roles_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions
CREATE TABLE permissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100) NOT NULL,
  group_name VARCHAR(50),
  module VARCHAR(50),
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_perm_company_code (company_id, code),
  INDEX idx_perm_company (company_id),
  INDEX idx_perm_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission junction
CREATE TABLE role_permissions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_rp (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Role junction
CREATE TABLE user_roles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ur (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOMERS (Loyalty Members)
-- ============================================================
CREATE TABLE customers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(30) NOT NULL,
  mobile VARCHAR(30),
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'UAE',
  postal_code VARCHAR(20),
  national_id VARCHAR(50),
  tags JSON,
  segment VARCHAR(50),
  source VARCHAR(50),
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  merged_into_id CHAR(36),
  lifetime_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_visits INT NOT NULL DEFAULT 0,
  last_visit_date DATETIME,
  registration_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (merged_into_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE KEY uq_customer_company_code (company_id, code),
  INDEX idx_customers_company (company_id),
  INDEX idx_customers_email (email),
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_segment (segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LOYALTY ACCOUNTS
-- ============================================================
CREATE TABLE loyalty_accounts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL UNIQUE,
  membership_id CHAR(36),
  account_number VARCHAR(50) NOT NULL,
  available_points INT NOT NULL DEFAULT 0,
  pending_points INT NOT NULL DEFAULT 0,
  expired_points INT NOT NULL DEFAULT 0,
  redeemed_points INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  lifetime_redeemed INT NOT NULL DEFAULT 0,
  current_tier_points INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  enrolled_date DATE,
  last_activity_date DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_la_company_account (company_id, account_number),
  INDEX idx_la_customer (customer_id),
  INDEX idx_la_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MEMBERSHIP TIERS
-- ============================================================
CREATE TABLE membership_tiers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  min_points INT NOT NULL DEFAULT 0,
  max_points INT,
  point_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  benefits JSON,
  icon VARCHAR(255),
  color VARCHAR(20),
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_mt_company_code (company_id, code),
  INDEX idx_mt_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Membership History
CREATE TABLE customer_memberships (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  tier_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('active','expired','upgraded','downgraded','renewed') NOT NULL DEFAULT 'active',
  previous_tier_id CHAR(36),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES membership_tiers(id) ON DELETE RESTRICT,
  FOREIGN KEY (previous_tier_id) REFERENCES membership_tiers(id) ON DELETE SET NULL,
  INDEX idx_cm_customer (customer_id),
  INDEX idx_cm_tier (tier_id),
  INDEX idx_cm_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- POINT TRANSACTIONS (Audit-ready ledger)
-- ============================================================
CREATE TABLE point_transactions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  loyalty_account_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  transaction_type ENUM('earn','redeem','reverse','adjust','expire','transfer_in','transfer_out','bonus','welcome','referral') NOT NULL,
  points INT NOT NULL,
  balance_before INT NOT NULL DEFAULT 0,
  balance_after INT NOT NULL DEFAULT 0,
  reference_type VARCHAR(50),
  reference_id CHAR(36),
  source VARCHAR(100),
  store_id CHAR(36),
  branch_id CHAR(36),
  pos_transaction_id VARCHAR(100),
  campaign_id CHAR(36),
  coupon_id CHAR(36),
  notes TEXT,
  expires_at DATETIME,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_pt_account (loyalty_account_id),
  INDEX idx_pt_customer (customer_id),
  INDEX idx_pt_company (company_id),
  INDEX idx_pt_type (transaction_type),
  INDEX idx_pt_created (created_at),
  INDEX idx_pt_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REWARD CATALOG
-- ============================================================
CREATE TABLE rewards (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  reward_type ENUM('gift_voucher','free_product','discount','cash_voucher','service','membership_upgrade','other') NOT NULL,
  points_required INT NOT NULL,
  value DECIMAL(10,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  image VARCHAR(255),
  terms_conditions TEXT,
  validity_days INT,
  stock_quantity INT DEFAULT -1,
  redemption_limit_per_customer INT DEFAULT -1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  start_date DATE,
  end_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reward_company_code (company_id, code),
  INDEX idx_rewards_company (company_id),
  INDEX idx_rewards_type (reward_type),
  INDEX idx_rewards_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reward Redemptions
CREATE TABLE reward_redemptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  reward_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  loyalty_account_id CHAR(36) NOT NULL,
  points_redeemed INT NOT NULL,
  status ENUM('pending','fulfilled','canceled','expired') NOT NULL DEFAULT 'pending',
  redemption_code VARCHAR(50),
  fulfilled_date DATETIME,
  canceled_date DATETIME,
  notes TEXT,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (loyalty_account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  INDEX idx_rr_customer (customer_id),
  INDEX idx_rr_reward (reward_id),
  INDEX idx_rr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CAMPAIGNS & PROMOTIONS
-- ============================================================
CREATE TABLE campaigns (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  campaign_type ENUM('points_multiplier','bonus_points','birthday','welcome','referral','festival','weekend','spend_threshold','product','category','store') NOT NULL,
  status ENUM('draft','active','paused','ended','canceled') NOT NULL DEFAULT 'draft',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  rules JSON,
  target_segments JSON,
  applicable_stores JSON,
  applicable_products JSON,
  applicable_categories JSON,
  budget DECIMAL(12,2),
  budget_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  priority INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_camp_company_code (company_id, code),
  INDEX idx_camp_company (company_id),
  INDEX idx_camp_status (status),
  INDEX idx_camp_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE coupons (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  coupon_type ENUM('single_use','reusable','limited') NOT NULL DEFAULT 'single_use',
  discount_type ENUM('percentage','fixed_amount','points') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0.00,
  max_discount DECIMAL(10,2),
  usage_limit INT DEFAULT -1,
  usage_count INT NOT NULL DEFAULT 0,
  per_customer_limit INT DEFAULT 1,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  applicable_products JSON,
  applicable_categories JSON,
  campaign_id CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  UNIQUE KEY uq_coupon_company_code (company_id, code),
  INDEX idx_coupon_company (company_id),
  INDEX idx_coupon_code (code),
  INDEX idx_coupon_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer Coupon Usage
CREATE TABLE coupon_usages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  coupon_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  order_reference VARCHAR(100),
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_cu_coupon (coupon_id),
  INDEX idx_cu_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GIFT CARDS
-- ============================================================
CREATE TABLE gift_cards (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  card_number VARCHAR(50) NOT NULL,
  pin VARCHAR(10),
  initial_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  status ENUM('active','redeemed','expired','canceled','suspended') NOT NULL DEFAULT 'active',
  purchaser_customer_id CHAR(36),
  recipient_customer_id CHAR(36),
  recipient_email VARCHAR(150),
  recipient_phone VARCHAR(30),
  message TEXT,
  start_date DATE,
  expiry_date DATE,
  redeemed_date DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (purchaser_customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE KEY uq_gc_company_card (company_id, card_number),
  INDEX idx_gc_status (status),
  INDEX idx_gc_recipient (recipient_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gift Card Transactions
CREATE TABLE gift_card_transactions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  gift_card_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  transaction_type ENUM('purchase','redeem','recharge','transfer','expire','reverse') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id CHAR(36),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_gct_card (gift_card_id),
  INDEX idx_gct_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE referrals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  referrer_customer_id CHAR(36) NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  referred_customer_id CHAR(36),
  referred_email VARCHAR(150),
  referred_phone VARCHAR(30),
  status ENUM('pending','registered','rewarded','expired','canceled') NOT NULL DEFAULT 'pending',
  reward_type ENUM('points','discount','cash','gift') NOT NULL DEFAULT 'points',
  reward_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  referrer_rewarded TINYINT(1) NOT NULL DEFAULT 0,
  referred_rewarded TINYINT(1) NOT NULL DEFAULT 0,
  registered_date DATETIME,
  rewarded_date DATETIME,
  expires_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (referrer_customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE KEY uq_ref_company_code (company_id, referral_code),
  INDEX idx_ref_referrer (referrer_customer_id),
  INDEX idx_ref_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notification_templates (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  channel ENUM('email','sms','push','whatsapp') NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSON,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_nt_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  customer_id CHAR(36),
  user_id CHAR(36),
  template_id CHAR(36),
  channel ENUM('email','sms','push','whatsapp') NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  status ENUM('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
  sent_at DATETIME,
  read_at DATETIME,
  error_message TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notif_company (company_id),
  INDEX idx_notif_customer (customer_id),
  INDEX idx_notif_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- API KEYS (for POS/CRM integrations)
-- ============================================================
CREATE TABLE api_keys (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  permissions JSON,
  allowed_ips JSON,
  rate_limit INT DEFAULT 1000,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_ak_company (company_id),
  INDEX idx_ak_key (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36),
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_company (company_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUPER ADMIN SETTINGS
-- ============================================================
CREATE TABLE super_admin_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USAGE TRACKING
-- ============================================================
CREATE TABLE usage_tracking (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  api_calls INT NOT NULL DEFAULT 0,
  transactions INT NOT NULL DEFAULT 0,
  storage_used_mb DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  active_users INT NOT NULL DEFAULT 0,
  active_customers INT NOT NULL DEFAULT 0,
  points_issued INT NOT NULL DEFAULT 0,
  points_redeemed INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ut_company_date (company_id, date),
  INDEX idx_ut_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BILLING
-- ============================================================
CREATE TABLE billing_invoices (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  subscription_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  status ENUM('draft','sent','paid','overdue','canceled') NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  paid_date DATETIME,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_bi_company (company_id),
  INDEX idx_bi_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  invoice_id CHAR(36),
  payment_method ENUM('credit_card','bank_transfer','cash','check','other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  transaction_reference VARCHAR(255),
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES billing_invoices(id) ON DELETE SET NULL,
  INDEX idx_pay_company (company_id),
  INDEX idx_pay_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
