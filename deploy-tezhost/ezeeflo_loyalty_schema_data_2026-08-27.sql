-- MySQL dump 10.13  Distrib 5.7.16, for Win64 (x86_64)
--
-- Host: localhost    Database: ezeeflo_loyalty
-- ------------------------------------------------------
-- Server version	5.7.16-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `ezeeflo_loyalty`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ezeeflo_loyalty` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `ezeeflo_loyalty`;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_keys` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json DEFAULT NULL,
  `allowed_ips` json DEFAULT NULL,
  `rate_limit` int(11) DEFAULT '1000',
  `is_active` tinyint(1) DEFAULT '1',
  `last_used_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `badges`
--

DROP TABLE IF EXISTS `badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `badges` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `badge_type` enum('achievement','streak','challenge','milestone','special','referral') COLLATE utf8mb4_unicode_ci DEFAULT 'achievement',
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criteria` json DEFAULT NULL,
  `points_reward` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `badges`
--

LOCK TABLES `badges` WRITE;
/*!40000 ALTER TABLE `badges` DISABLE KEYS */;
/*!40000 ALTER TABLE `badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_invoices`
--

DROP TABLE IF EXISTS `billing_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `billing_invoices` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subscription_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `status` enum('draft','sent','paid','overdue','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `due_date` date NOT NULL,
  `paid_date` datetime DEFAULT NULL,
  `billing_period_start` date NOT NULL,
  `billing_period_end` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `billing_invoices_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_invoices`
--

LOCK TABLES `billing_invoices` WRITE;
/*!40000 ALTER TABLE `billing_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `billing_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaigns` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `campaign_type` enum('points_multiplier','bonus_points','birthday','welcome','referral','festival','weekend','spend_threshold','product','category','store') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','active','paused','ended','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `rules` json DEFAULT NULL,
  `target_segments` json DEFAULT NULL,
  `applicable_stores` json DEFAULT NULL,
  `applicable_products` json DEFAULT NULL,
  `applicable_categories` json DEFAULT NULL,
  `budget` decimal(12,2) DEFAULT NULL,
  `budget_spent` decimal(12,2) DEFAULT '0.00',
  `priority` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES ('5e3aee0c-74ce-4ad5-b328-b3229fd0baf5','00000000-0000-0000-0000-000000000001','Testing','T001','','festival','draft','2027-01-01 08:00:00','2027-03-01 09:00:00','{\"multiplier\": 2, \"bonusPoints\": 50}','[]',NULL,NULL,NULL,30000.00,0.00,1,1,NULL,'2026-08-06 15:24:35','2026-08-06 15:24:35',NULL);
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UAE',
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AED',
  `currency_symbol` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'د.إ',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Dubai',
  `status` enum('active','inactive','suspended','trial','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'trial',
  `trial_start_date` date DEFAULT NULL,
  `trial_end_date` date DEFAULT NULL,
  `max_users` int(11) DEFAULT '5',
  `max_customers` int(11) DEFAULT '100',
  `settings` json DEFAULT NULL,
  `branding` json DEFAULT NULL,
  `subscription_status` enum('active','past_due','canceled','expired','trialing') COLLATE utf8mb4_unicode_ci DEFAULT 'trialing',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('00000000-0000-0000-0000-000000000001','EzeeFlo Loyalty Platform','EZEEFLO','admin@ezeeflo.com','','',NULL,'','','','','UAE','','AED','د.إ','Asia/Dubai','active',NULL,NULL,5,100,NULL,NULL,'active','2026-08-06 14:29:25','2026-08-06 15:48:29',NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_subscription_modules`
--

DROP TABLE IF EXISTS `company_subscription_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_subscription_modules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_subscription_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `module_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_subscription_id` (`company_subscription_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `company_subscription_modules_ibfk_1` FOREIGN KEY (`company_subscription_id`) REFERENCES `company_subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_subscription_modules_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `subscription_modules` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_subscription_modules`
--

LOCK TABLES `company_subscription_modules` WRITE;
/*!40000 ALTER TABLE `company_subscription_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_subscription_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_subscriptions`
--

DROP TABLE IF EXISTS `company_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_subscriptions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `plan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `billing_cycle` enum('monthly','quarterly','biannual','annual') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `status` enum('active','past_due','canceled','expired','trialing') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `auto_renew` tinyint(1) DEFAULT '1',
  `trial_days` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `company_subscriptions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `company_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_subscriptions`
--

LOCK TABLES `company_subscriptions` WRITE;
/*!40000 ALTER TABLE `company_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_usages`
--

DROP TABLE IF EXISTS `coupon_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_usages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `coupon_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `order_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_applied` decimal(10,2) NOT NULL,
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coupon_id` (`coupon_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `coupon_usages_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `coupon_usages_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usages`
--

LOCK TABLES `coupon_usages` WRITE;
/*!40000 ALTER TABLE `coupon_usages` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupon_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coupon_type` enum('single_use','reusable','limited') COLLATE utf8mb4_unicode_ci DEFAULT 'single_use',
  `discount_type` enum('percentage','fixed_amount','points') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(10,2) DEFAULT '0.00',
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT '-1',
  `usage_count` int(11) DEFAULT '0',
  `per_customer_limit` int(11) DEFAULT '1',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `applicable_products` json DEFAULT NULL,
  `applicable_categories` json DEFAULT NULL,
  `campaign_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `campaign_id` (`campaign_id`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `coupons_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES ('6dc76056-9ee6-42d0-b403-f2416bc4460b','00000000-0000-0000-0000-000000000001','CPN-MSHFJ6NC8UTR','single_use','percentage',10.00,1.00,200.00,3,0,5,'2027-01-01 08:00:00','2027-01-31 23:59:00',1,NULL,NULL,NULL,'2026-08-06 15:25:29','2026-08-06 15:25:29',NULL);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_badges`
--

DROP TABLE IF EXISTS `customer_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_badges` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `badge_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `earned_at` datetime DEFAULT NULL,
  `progress` int(11) DEFAULT '0',
  `progress_target` int(11) DEFAULT '100',
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_badges`
--

LOCK TABLES `customer_badges` WRITE;
/*!40000 ALTER TABLE `customer_badges` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_memberships`
--

DROP TABLE IF EXISTS `customer_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_memberships` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tier_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','expired','upgraded','downgraded','renewed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `previous_tier_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `customer_id` (`customer_id`),
  KEY `tier_id` (`tier_id`),
  KEY `previous_tier_id` (`previous_tier_id`),
  CONSTRAINT `customer_memberships_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `customer_memberships_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `customer_memberships_ibfk_3` FOREIGN KEY (`tier_id`) REFERENCES `membership_tiers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `customer_memberships_ibfk_4` FOREIGN KEY (`previous_tier_id`) REFERENCES `membership_tiers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_memberships`
--

LOCK TABLES `customer_memberships` WRITE;
/*!40000 ALTER TABLE `customer_memberships` DISABLE KEYS */;
INSERT INTO `customer_memberships` VALUES ('063c9ef9-abb7-4e4f-b903-2a237037423e','00000000-0000-0000-0000-000000000001','f2b8ed3c-718d-4523-8821-14bafb9ad55e','a23d6a8e-2a2f-403a-b57f-1d54d5b3caf5','2026-08-06',NULL,'active',NULL,'Auto-assigned on registration','2026-08-06 14:52:58','2026-08-06 14:52:58');
/*!40000 ALTER TABLE `customer_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_segments`
--

DROP TABLE IF EXISTS `customer_segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_segments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `segment_type` enum('dynamic','static','ai_generated') COLLATE utf8mb4_unicode_ci DEFAULT 'dynamic',
  `filters` json DEFAULT NULL,
  `customer_ids` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `refresh_interval` int(11) DEFAULT '1440',
  `last_refreshed_at` datetime DEFAULT NULL,
  `customer_count` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `customer_segments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_segments`
--

LOCK TABLES `customer_segments` WRITE;
/*!40000 ALTER TABLE `customer_segments` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_segments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_streaks`
--

DROP TABLE IF EXISTS `customer_streaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_streaks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `streak_type` enum('daily_login','daily_purchase','weekly_purchase','referral','review') COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_streak` int(11) DEFAULT '0',
  `longest_streak` int(11) DEFAULT '0',
  `last_activity_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_streaks`
--

LOCK TABLES `customer_streaks` WRITE;
/*!40000 ALTER TABLE `customer_streaks` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_streaks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'UAE',
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `national_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `segment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `merged_into_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `lifetime_value` decimal(12,2) DEFAULT '0.00',
  `total_visits` int(11) DEFAULT '0',
  `last_visit_date` datetime DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `customers_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('f2b8ed3c-718d-4523-8821-14bafb9ad55e','00000000-0000-0000-0000-000000000001','CUS-000001','Yasir','Majeed','johnsteward777@gmail.com','0559540912','0559540912','1990-01-01','male','France Cluster',NULL,'Dubai','Dubai','UAE','38000','DMXC001','[]','Regular','in_store','',1,NULL,0.00,0,NULL,'2026-08-06','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','2026-08-06 14:52:58','2026-08-06 14:52:58',NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fraud_alerts`
--

DROP TABLE IF EXISTS `fraud_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fraud_alerts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `fraud_rule_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `evidence` json DEFAULT NULL,
  `status` enum('open','investigating','resolved','dismissed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `resolved_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fraud_alerts`
--

LOCK TABLES `fraud_alerts` WRITE;
/*!40000 ALTER TABLE `fraud_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `fraud_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fraud_rules`
--

DROP TABLE IF EXISTS `fraud_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fraud_rules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `fraud_type` enum('duplicate_account','suspicious_redemption','abnormal_accumulation','rule_abuse','multiple_devices','rapid_transactions','geo_anomaly','amount_anomaly') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `conditions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `auto_block` tinyint(1) DEFAULT '0',
  `notification_channels` json DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fraud_rules`
--

LOCK TABLES `fraud_rules` WRITE;
/*!40000 ALTER TABLE `fraud_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `fraud_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_card_transactions`
--

DROP TABLE IF EXISTS `gift_card_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gift_card_transactions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `gift_card_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `transaction_type` enum('purchase','redeem','recharge','transfer','expire','reverse') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gift_card_id` (`gift_card_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `gift_card_transactions_ibfk_1` FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `gift_card_transactions_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_card_transactions`
--

LOCK TABLES `gift_card_transactions` WRITE;
/*!40000 ALTER TABLE `gift_card_transactions` DISABLE KEYS */;
INSERT INTO `gift_card_transactions` VALUES ('51da7c82-2a01-4833-ac6b-5555c3cfb92f','bae7bf2a-3890-4a1a-a78f-893bf753013c','00000000-0000-0000-0000-000000000001','purchase',3000.00,0.00,3000.00,'purchase',NULL,'Gift card purchased',NULL,'2026-08-06 15:32:28');
/*!40000 ALTER TABLE `gift_card_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_cards`
--

DROP TABLE IF EXISTS `gift_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gift_cards` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `card_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initial_balance` decimal(10,2) NOT NULL,
  `current_balance` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `status` enum('active','redeemed','expired','canceled','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `purchaser_customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `recipient_customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `recipient_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `redeemed_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `purchaser_customer_id` (`purchaser_customer_id`),
  KEY `recipient_customer_id` (`recipient_customer_id`),
  CONSTRAINT `gift_cards_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `gift_cards_ibfk_2` FOREIGN KEY (`purchaser_customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `gift_cards_ibfk_3` FOREIGN KEY (`recipient_customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_cards`
--

LOCK TABLES `gift_cards` WRITE;
/*!40000 ALTER TABLE `gift_cards` DISABLE KEYS */;
INSERT INTO `gift_cards` VALUES ('bae7bf2a-3890-4a1a-a78f-893bf753013c','00000000-0000-0000-0000-000000000001','GC-12B5BF2352','2379',3000.00,3000.00,'AED','active','f2b8ed3c-718d-4523-8821-14bafb9ad55e',NULL,NULL,NULL,NULL,'2026-08-06','2027-01-01',NULL,'2026-08-06 15:32:28','2026-08-06 15:32:28',NULL);
/*!40000 ALTER TABLE `gift_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licenses`
--

DROP TABLE IF EXISTS `licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `licenses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `license_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `grace_period_days` int(11) DEFAULT '7',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_key` (`license_key`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `licenses_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licenses`
--

LOCK TABLES `licenses` WRITE;
/*!40000 ALTER TABLE `licenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_accounts`
--

DROP TABLE IF EXISTS `loyalty_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loyalty_accounts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `membership_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `available_points` int(11) DEFAULT '0',
  `pending_points` int(11) DEFAULT '0',
  `expired_points` int(11) DEFAULT '0',
  `redeemed_points` int(11) DEFAULT '0',
  `lifetime_earned` int(11) DEFAULT '0',
  `lifetime_redeemed` int(11) DEFAULT '0',
  `current_tier_points` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `enrolled_date` date DEFAULT NULL,
  `last_activity_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id` (`customer_id`),
  KEY `company_id` (`company_id`),
  KEY `membership_id` (`membership_id`),
  CONSTRAINT `loyalty_accounts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `loyalty_accounts_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `loyalty_accounts_ibfk_3` FOREIGN KEY (`membership_id`) REFERENCES `membership_tiers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_accounts`
--

LOCK TABLES `loyalty_accounts` WRITE;
/*!40000 ALTER TABLE `loyalty_accounts` DISABLE KEYS */;
INSERT INTO `loyalty_accounts` VALUES ('145d5059-4021-4d2f-919b-b53f2dde6f4a','00000000-0000-0000-0000-000000000001','f2b8ed3c-718d-4523-8821-14bafb9ad55e','a23d6a8e-2a2f-403a-b57f-1d54d5b3caf5','LY-CUS-000001',100,0,0,0,100,0,100,1,'2026-08-06','2026-08-06 15:22:07','2026-08-06 14:52:58','2026-08-06 15:22:07',NULL);
/*!40000 ALTER TABLE `loyalty_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_rules`
--

DROP TABLE IF EXISTS `loyalty_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loyalty_rules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `rule_type` enum('earn','redeem','bonus','tier_upgrade','tier_downgrade','expiry') COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `conditions` json DEFAULT NULL,
  `actions` json DEFAULT NULL,
  `applicable_stores` json DEFAULT NULL,
  `applicable_branches` json DEFAULT NULL,
  `target_segments` json DEFAULT NULL,
  `max_applications` int(11) DEFAULT NULL,
  `max_applications_per_customer` int(11) DEFAULT NULL,
  `application_count` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `loyalty_rules_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_rules`
--

LOCK TABLES `loyalty_rules` WRITE;
/*!40000 ALTER TABLE `loyalty_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marketing_workflows`
--

DROP TABLE IF EXISTS `marketing_workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marketing_workflows` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `trigger_type` enum('inactive_days','birthday','anniversary','first_purchase','nth_purchase','tier_upgrade','points_expiring','high_spend','low_activity','campaign_join','referral_complete','custom') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_config` json DEFAULT NULL,
  `steps` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `target_segments` json DEFAULT NULL,
  `execution_count` int(11) DEFAULT '0',
  `last_executed_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `marketing_workflows_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketing_workflows`
--

LOCK TABLES `marketing_workflows` WRITE;
/*!40000 ALTER TABLE `marketing_workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketing_workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membership_tiers`
--

DROP TABLE IF EXISTS `membership_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `membership_tiers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `min_points` int(11) DEFAULT '0',
  `max_points` int(11) DEFAULT NULL,
  `point_multiplier` decimal(5,2) DEFAULT '1.00',
  `benefits` json DEFAULT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `membership_tiers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membership_tiers`
--

LOCK TABLES `membership_tiers` WRITE;
/*!40000 ALTER TABLE `membership_tiers` DISABLE KEYS */;
INSERT INTO `membership_tiers` VALUES ('11b83899-e269-4dc9-9d2b-faf699a17fd6','00000000-0000-0000-0000-000000000001','Gold','gold','Gold tier membership',2000,4999,1.50,'{\"free_shipping\": true, \"birthday_bonus\": true, \"priority_support\": true}',NULL,'#F59E0B',3,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('33399e37-be8a-4945-a4ca-8e80abc1b68d','00000000-0000-0000-0000-000000000001','Platinum','platinum','Platinum tier membership',5000,9999,2.00,'{\"free_shipping\": true, \"birthday_bonus\": true, \"exclusive_events\": true, \"priority_support\": true}',NULL,'#8B5CF6',4,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('9d59c37d-391f-4d33-b3a5-224f2883050a','00000000-0000-0000-0000-000000000001','VIP','vip','VIP tier - by invitation only',25000,NULL,3.00,'{\"concierge\": true, \"free_shipping\": true, \"birthday_bonus\": true, \"exclusive_events\": true, \"personal_manager\": true, \"priority_support\": true}',NULL,'#EF4444',6,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('a23d6a8e-2a2f-403a-b57f-1d54d5b3caf5','00000000-0000-0000-0000-000000000001','Standard','standard','Entry-level membership',0,499,1.00,'{\"birthday_bonus\": true}',NULL,'#6B7280',1,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('bf3a4eeb-f7ce-4e54-9b91-ad116728060f','00000000-0000-0000-0000-000000000001','Silver','silver','Silver tier membership',500,1999,1.25,'{\"birthday_bonus\": true, \"priority_support\": true}',NULL,'#777b83',2,1,'2026-08-06 14:29:26','2026-08-06 16:33:47',NULL),('f637903e-ff8b-4e3d-9973-e23509d3b3c4','00000000-0000-0000-0000-000000000001','Diamond','diamond','Diamond tier membership',10000,24999,2.50,'{\"free_shipping\": true, \"birthday_bonus\": true, \"exclusive_events\": true, \"personal_manager\": true, \"priority_support\": true}',NULL,'#06B6D4',5,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL);
/*!40000 ALTER TABLE `membership_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_templates` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms','push','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `notification_templates_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_templates`
--

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `template_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `channel` enum('email','sms','push','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','sent','failed','read') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `invoice_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `payment_method` enum('credit_card','bank_transfer','cash','check','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `transaction_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('00564b76-d696-4700-b872-67fe6f7293c6','00000000-0000-0000-0000-000000000001','View Loyalty Accounts','loyalty.view','Loyalty','loyalty',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('03453d3f-a8fe-4c13-9fe7-e7d6d3a9b101','00000000-0000-0000-0000-000000000001','View Reports','reports.view','Reports','reports',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('0adeabe7-dada-4a88-af71-2fdaa4d01dec','00000000-0000-0000-0000-000000000001','Manage Referrals','referrals.manage','Referrals','referrals',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('13e0594b-f0ac-419a-8029-ab47424981f5','00000000-0000-0000-0000-000000000001','View Roles','roles.view','Roles','roles',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('1b75b3d8-c036-478a-96d8-f4c224f588e8','00000000-0000-0000-0000-000000000001','Delete Users','users.delete','Users','users',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('2442c172-d6ae-44c4-9f76-57a50320d1db','00000000-0000-0000-0000-000000000001','View Rewards','rewards.view','Rewards','rewards',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('258e0393-6306-41e4-a9cc-d768a3247bbe','00000000-0000-0000-0000-000000000001','Delete Customers','customers.delete','Customers','customers',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('27d95acc-f0d9-435d-b452-45cb06a6370a','00000000-0000-0000-0000-000000000001','View Gift Cards','giftcards.view','Gift Cards','giftcards',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('27de49a4-273c-48b0-889f-80322c37c26c','00000000-0000-0000-0000-000000000001','Manage Points','points.manage','Loyalty','loyalty',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('34c1a27f-87bd-4cfb-9056-b3c2d1daf8bf','00000000-0000-0000-0000-000000000001','View Membership','membership.view','Membership','membership',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('3ca985a0-b4c9-44c0-af05-ee21f065c182','00000000-0000-0000-0000-000000000001','Edit Roles','roles.edit','Roles','roles',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('4b259f60-1335-4e26-9b03-8eddf3acf7ed','00000000-0000-0000-0000-000000000001','Create Permissions','permissions.create','Permissions','permissions',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('560afdbc-903d-4f1a-bee2-55baddc8699a','00000000-0000-0000-0000-000000000001','View Dashboard','dashboard.view','Dashboard','dashboard',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('564211dd-2c6f-4ccc-ae7e-9fdce5941408','00000000-0000-0000-0000-000000000001','Manage Coupons','coupons.manage','Coupons','coupons',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('62189dcd-69bb-4ddd-bb62-d87743d516cc','00000000-0000-0000-0000-000000000001','Delete Roles','roles.delete','Roles','roles',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('6c0cf883-45da-4e3a-9c7b-3990972c993f','00000000-0000-0000-0000-000000000001','Create Customers','customers.create','Customers','customers',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('7a3a5763-1fbb-4292-a678-6998a968048b','00000000-0000-0000-0000-000000000001','View Transactions','transactions.view','Loyalty','loyalty',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('7c9fe8e5-3fac-4de1-b4df-42adf019cff0','00000000-0000-0000-0000-000000000001','Merge Customers','customers.merge','Customers','customers',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('83544c6c-f5d9-41ec-9a9f-043fbf4bcd92','00000000-0000-0000-0000-000000000001','Manage Rewards','rewards.manage','Rewards','rewards',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('91d47cb4-ada5-455f-8793-8101f9c9c3e7','00000000-0000-0000-0000-000000000001','Manage Settings','settings.manage','Settings','settings',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('93ba0d22-9ee0-4aab-8997-3dbc6e5f7e57','00000000-0000-0000-0000-000000000001','Edit Permissions','permissions.edit','Permissions','permissions',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('9a94ee38-f5e5-4eed-bba5-fb4607798f51','00000000-0000-0000-0000-000000000001','Edit Customers','customers.edit','Customers','customers',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('a050a195-6995-4ae0-ac0f-8c8a0e0adcb6','00000000-0000-0000-0000-000000000001','View Permissions','permissions.view','Permissions','permissions',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('a5742f41-68d3-4fce-985e-c0566b6afbc0','00000000-0000-0000-0000-000000000001','View Referrals','referrals.view','Referrals','referrals',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('a8daf76c-6061-489e-b6cf-4cd0293ef739','00000000-0000-0000-0000-000000000001','Create Roles','roles.create','Roles','roles',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('af21490c-324e-4e30-93dc-0cd776c56ece','00000000-0000-0000-0000-000000000001','Edit Users','users.edit','Users','users',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('b439a4fb-59e9-4f58-976f-a500760edd41','00000000-0000-0000-0000-000000000001','Delete Permissions','permissions.delete','Permissions','permissions',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('b77d2d7c-ed92-4d87-bb39-ab5aa3efc4f7','00000000-0000-0000-0000-000000000001','View Users','users.view','Users','users',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('bd64f007-d3ea-4f49-b6eb-fd06fdcc6515','00000000-0000-0000-0000-000000000001','Manage Gift Cards','giftcards.manage','Gift Cards','giftcards',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('c01fe027-f1e1-4b0b-a3b5-f1d46b0393f0','00000000-0000-0000-0000-000000000001','Manage Membership','membership.manage','Membership','membership',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('c9cf27b8-a4dc-415e-a45e-cc262bb496cc','00000000-0000-0000-0000-000000000001','Create Users','users.create','Users','users',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('d2c5dc30-624f-4a42-8dba-af34e9406f9d','00000000-0000-0000-0000-000000000001','Manage Campaigns','campaigns.manage','Campaigns','campaigns',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('ef431989-4338-481e-bef0-eaf962ca2cea','00000000-0000-0000-0000-000000000001','View Customers','customers.view','Customers','customers',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('efbb871f-657e-460f-bb12-e9665d217b14','00000000-0000-0000-0000-000000000001','View Settings','settings.view','Settings','settings',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('f0994453-a6ae-47e9-8c5c-cd36b99d2698','00000000-0000-0000-0000-000000000001','View Campaigns','campaigns.view','Campaigns','campaigns',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('f403f005-f44c-449f-8762-0df8806ce087','00000000-0000-0000-0000-000000000001','Manage API Keys','api.manage','API','api',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('f8842749-694c-43d1-a569-9d9feb335e2f','00000000-0000-0000-0000-000000000001','View Coupons','coupons.view','Coupons','coupons',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('fdea085b-3232-44ca-b6d4-1c6f49e1e127','00000000-0000-0000-0000-000000000001','View Audit Logs','audit.view','Security','audit',NULL,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `point_transactions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `loyalty_account_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `transaction_type` enum('earn','redeem','reverse','adjust','expire','transfer_in','transfer_out','bonus','welcome','referral') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int(11) NOT NULL,
  `balance_before` int(11) DEFAULT '0',
  `balance_after` int(11) DEFAULT '0',
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `branch_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `pos_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `coupon_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `expires_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `loyalty_account_id` (`loyalty_account_id`),
  KEY `customer_id` (`customer_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `point_transactions_ibfk_2` FOREIGN KEY (`loyalty_account_id`) REFERENCES `loyalty_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `point_transactions_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `point_transactions_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_transactions`
--

LOCK TABLES `point_transactions` WRITE;
/*!40000 ALTER TABLE `point_transactions` DISABLE KEYS */;
INSERT INTO `point_transactions` VALUES ('f2d8c08a-442a-4e43-9780-9beb92e9ee10','00000000-0000-0000-0000-000000000001','145d5059-4021-4d2f-919b-b53f2dde6f4a','f2b8ed3c-718d-4523-8821-14bafb9ad55e','earn',100,0,100,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,'',NULL,'8a6bee69-cdcb-4693-b82d-bbd6ae395b32','2026-08-06 15:22:07');
/*!40000 ALTER TABLE `point_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referrals`
--

DROP TABLE IF EXISTS `referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referrals` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `referrer_customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `referral_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referred_customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `referred_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referred_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','registered','rewarded','expired','canceled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reward_type` enum('points','discount','cash','gift') COLLATE utf8mb4_unicode_ci DEFAULT 'points',
  `reward_value` decimal(10,2) DEFAULT '0.00',
  `referrer_rewarded` tinyint(1) DEFAULT '0',
  `referred_rewarded` tinyint(1) DEFAULT '0',
  `registered_date` datetime DEFAULT NULL,
  `rewarded_date` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `referrer_customer_id` (`referrer_customer_id`),
  KEY `referred_customer_id` (`referred_customer_id`),
  CONSTRAINT `referrals_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `referrals_ibfk_2` FOREIGN KEY (`referrer_customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `referrals_ibfk_3` FOREIGN KEY (`referred_customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referrals`
--

LOCK TABLES `referrals` WRITE;
/*!40000 ALTER TABLE `referrals` DISABLE KEYS */;
INSERT INTO `referrals` VALUES ('fc759b60-0903-4cf0-9536-b048dd64d99b','00000000-0000-0000-0000-000000000001','f2b8ed3c-718d-4523-8821-14bafb9ad55e','REF-CUS-000001-2J4S',NULL,NULL,NULL,'pending','points',100.00,0,0,NULL,NULL,'2026-11-04 15:27:01','2026-08-06 15:27:01','2026-08-06 15:27:01');
/*!40000 ALTER TABLE `referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES ('0e66f56d-18bc-4015-b8f7-8906241dc524','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxMzI0NSwiZXhwIjoxNzg2NjE4MDQ1fQ.DY02fWwv5kGcwhV2cXOO2fp2bN8WNpFvRt-F-UHSm74','2026-08-13 14:47:25',0,'2026-08-06 14:47:25'),('739d68de-53db-49f4-be35-349178f2c8bd','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NzgzNjU2MiwiZXhwIjoxNzg4NDQxMzYyfQ.XcA-4gFmiUT22pSs8yeIjzMdPEQVpaQV209YtpxCyLs','2026-09-03 17:16:02',0,'2026-08-27 17:16:02'),('9ed1bca8-3aba-4297-846b-b244045a04b4','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjcyMDg3NCwiZXhwIjoxNzg3MzI1Njc0fQ.xNGkKhHLV-J9btoQC1iAlYj0xmMrskLiLpLOOO35CR8','2026-08-21 19:21:14',1,'2026-08-14 19:21:14'),('b64ccf98-118d-4631-8519-9d727c9d60e9','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxNjAwNCwiZXhwIjoxNzg2NjIwODA0fQ.9OEobokbUZBCQdFIgceWOf9MyZLa2pRKw6CwPIyDnLk','2026-08-13 15:33:24',0,'2026-08-06 15:33:24'),('c2c1eb09-ede3-4e43-bc16-667ad32ed52e','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxNzYyNywiZXhwIjoxNzg2NjIyNDI3fQ.NykTtXWvmda89A92A2_u8ea90tEB2G9u5H0EIpvTWwQ','2026-08-13 16:00:27',0,'2026-08-06 16:00:27'),('d40b90d5-c345-48d1-9e3e-6e8ab95a2bbd','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxMzA4OSwiZXhwIjoxNzg2NjE3ODg5fQ.uBMQly7EotaTjcnePr_KdFPtEzaTde0cveVl37eNYHY','2026-08-13 14:44:49',0,'2026-08-06 14:44:49'),('d82b8b5b-3e64-499e-be0d-c40cf499f878','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxNzYzOCwiZXhwIjoxNzg2NjIyNDM4fQ.donOaFaXGB6qE_P0RexUqH38rXW7V8-O-tB22g40taA','2026-08-13 16:00:38',0,'2026-08-06 16:00:38'),('f0433e5e-ac66-4336-9a8e-683787968446','8a6bee69-cdcb-4693-b82d-bbd6ae395b32','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NjAxNDAxOSwiZXhwIjoxNzg2NjE4ODE5fQ.86_n7160y9kDZd276_50lP17qYUm42mJCqyQ52XVN54','2026-08-13 15:00:19',1,'2026-08-06 15:00:19');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_redemptions`
--

DROP TABLE IF EXISTS `reward_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reward_redemptions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `reward_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `loyalty_account_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `points_redeemed` int(11) NOT NULL,
  `status` enum('pending','fulfilled','canceled','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `redemption_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fulfilled_date` datetime DEFAULT NULL,
  `canceled_date` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `reward_id` (`reward_id`),
  KEY `customer_id` (`customer_id`),
  KEY `loyalty_account_id` (`loyalty_account_id`),
  CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `reward_redemptions_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reward_redemptions_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reward_redemptions_ibfk_4` FOREIGN KEY (`loyalty_account_id`) REFERENCES `loyalty_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_redemptions`
--

LOCK TABLES `reward_redemptions` WRITE;
/*!40000 ALTER TABLE `reward_redemptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `reward_redemptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards`
--

DROP TABLE IF EXISTS `rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rewards` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `reward_type` enum('gift_voucher','free_product','discount','cash_voucher','service','membership_upgrade','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points_required` int(11) NOT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci,
  `validity_days` int(11) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT '-1',
  `redemption_limit_per_customer` int(11) DEFAULT '-1',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
INSERT INTO `rewards` VALUES ('a8c855ef-68ec-44bd-b233-3ef45ce09611','00000000-0000-0000-0000-000000000001','EID Reward','EID01','','gift_voucher',100,500.00,'AED','','',30,10,2,1,NULL,NULL,'2026-08-06 15:22:52','2026-08-06 15:22:52',NULL);
/*!40000 ALTER TABLE `rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `permission_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_roleId_permissionId_unique` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('05c205a6-2af4-4e3b-895a-1a21f379aa46','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','f8842749-694c-43d1-a569-9d9feb335e2f','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('061b8b5b-e42f-4a8e-a321-5e10d55ba82d','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','f0994453-a6ae-47e9-8c5c-cd36b99d2698','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('06b9bd71-34fe-4620-9a6b-a71352174015','109e7d50-5606-4e0b-a6e1-307bdea8759f','b439a4fb-59e9-4f58-976f-a500760edd41','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('088cb871-e75d-4d11-9404-a4c8b553f9c9','109e7d50-5606-4e0b-a6e1-307bdea8759f','b77d2d7c-ed92-4d87-bb39-ab5aa3efc4f7','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('1678a482-e890-4ffd-85c0-a24c0ed82d54','109e7d50-5606-4e0b-a6e1-307bdea8759f','f403f005-f44c-449f-8762-0df8806ce087','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('1ee6cde5-8f54-492e-b4d4-cccfe39d5989','109e7d50-5606-4e0b-a6e1-307bdea8759f','a5742f41-68d3-4fce-985e-c0566b6afbc0','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('20507469-5ecd-46d2-a5a4-afccbde98074','109e7d50-5606-4e0b-a6e1-307bdea8759f','bd64f007-d3ea-4f49-b6eb-fd06fdcc6515','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('207f3470-88c5-4844-b7e8-729b8a166521','109e7d50-5606-4e0b-a6e1-307bdea8759f','1b75b3d8-c036-478a-96d8-f4c224f588e8','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('20fdd315-44d4-442a-a197-04272f9d3fae','109e7d50-5606-4e0b-a6e1-307bdea8759f','3ca985a0-b4c9-44c0-af05-ee21f065c182','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('2b383a35-4e5f-44e9-a6c3-73df25a6061e','109e7d50-5606-4e0b-a6e1-307bdea8759f','f8842749-694c-43d1-a569-9d9feb335e2f','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('2db0b314-cc60-4bd3-ba2b-d37003ff64eb','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','03453d3f-a8fe-4c13-9fe7-e7d6d3a9b101','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('2f637019-f7c4-40dc-9f04-63a3e7cfeac8','109e7d50-5606-4e0b-a6e1-307bdea8759f','7a3a5763-1fbb-4292-a678-6998a968048b','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('3642b2b1-67ef-487b-bd0b-44c1f0fd1e96','109e7d50-5606-4e0b-a6e1-307bdea8759f','f0994453-a6ae-47e9-8c5c-cd36b99d2698','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('3b7ee965-9a4d-4b81-970a-7a1da04bb058','109e7d50-5606-4e0b-a6e1-307bdea8759f','c01fe027-f1e1-4b0b-a3b5-f1d46b0393f0','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('4a6a8d22-3ec4-406d-8c13-fee1da6b224f','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','efbb871f-657e-460f-bb12-e9665d217b14','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('4b885655-a7e3-42e6-ad34-05df9b894a1a','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','ef431989-4338-481e-bef0-eaf962ca2cea','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('4c1cd7b8-5ffe-493f-907b-9d45c48dc51f','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','fdea085b-3232-44ca-b6d4-1c6f49e1e127','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('5754a692-f96b-41bf-98cc-636695ed3d8c','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','2442c172-d6ae-44c4-9f76-57a50320d1db','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('5bcc0d39-f7a4-45f6-b3bb-8b41ab4f32cb','109e7d50-5606-4e0b-a6e1-307bdea8759f','d2c5dc30-624f-4a42-8dba-af34e9406f9d','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('5d7d290c-e480-45fd-8287-9df0d47b706f','109e7d50-5606-4e0b-a6e1-307bdea8759f','93ba0d22-9ee0-4aab-8997-3dbc6e5f7e57','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('61f7e9bd-c557-40d5-b42e-926d1d8eeb83','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','13e0594b-f0ac-419a-8029-ab47424981f5','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('64044866-8c5e-4683-a1fe-b6496be453e3','109e7d50-5606-4e0b-a6e1-307bdea8759f','27d95acc-f0d9-435d-b452-45cb06a6370a','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('64a0fd5a-9a94-44fe-9cd8-b6bf9aa69533','109e7d50-5606-4e0b-a6e1-307bdea8759f','4b259f60-1335-4e26-9b03-8eddf3acf7ed','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('6ac93a2a-19b3-40ff-b4f2-f59ef495942d','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','560afdbc-903d-4f1a-bee2-55baddc8699a','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('6e6f7c43-509b-4ee8-a35a-0b71acb93c44','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','b77d2d7c-ed92-4d87-bb39-ab5aa3efc4f7','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('80cf51fd-f553-461f-886f-18ffd0518211','109e7d50-5606-4e0b-a6e1-307bdea8759f','83544c6c-f5d9-41ec-9a9f-043fbf4bcd92','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('82588770-dabb-4a0a-aa4d-2fe174447fa5','109e7d50-5606-4e0b-a6e1-307bdea8759f','27de49a4-273c-48b0-889f-80322c37c26c','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('8fe9cd4e-2bb4-4c94-bc5e-36ecdec89102','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','34c1a27f-87bd-4cfb-9056-b3c2d1daf8bf','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('8fea735b-c01a-4db5-904b-9af76ebf70be','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','00564b76-d696-4700-b872-67fe6f7293c6','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('9d7e0d0f-31f8-470e-b91b-bf3015d16fb0','109e7d50-5606-4e0b-a6e1-307bdea8759f','fdea085b-3232-44ca-b6d4-1c6f49e1e127','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('9e9c7929-3072-4b33-a19a-bbc910e3a75f','109e7d50-5606-4e0b-a6e1-307bdea8759f','03453d3f-a8fe-4c13-9fe7-e7d6d3a9b101','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('a23bea02-b09a-4639-8f45-de0e9ef9e6e7','109e7d50-5606-4e0b-a6e1-307bdea8759f','a050a195-6995-4ae0-ac0f-8c8a0e0adcb6','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('a5e242ce-42a7-4105-a36d-21d4f1781aa2','109e7d50-5606-4e0b-a6e1-307bdea8759f','34c1a27f-87bd-4cfb-9056-b3c2d1daf8bf','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('a78a9fe2-42c1-4509-8222-9f0ebdeb4f6c','109e7d50-5606-4e0b-a6e1-307bdea8759f','a8daf76c-6061-489e-b6cf-4cd0293ef739','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('b00b92ba-4341-4335-9f02-713e4545d191','109e7d50-5606-4e0b-a6e1-307bdea8759f','91d47cb4-ada5-455f-8793-8101f9c9c3e7','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('b020c75a-44c3-44a8-9e34-ecf889900712','109e7d50-5606-4e0b-a6e1-307bdea8759f','560afdbc-903d-4f1a-bee2-55baddc8699a','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('bb59aefc-9c88-4e7b-bcdd-80bb6bf37ec2','109e7d50-5606-4e0b-a6e1-307bdea8759f','62189dcd-69bb-4ddd-bb62-d87743d516cc','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('bea6346c-b39a-456b-8184-80e6acfb6eb2','109e7d50-5606-4e0b-a6e1-307bdea8759f','6c0cf883-45da-4e3a-9c7b-3990972c993f','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('c09fd542-a937-41e9-a67d-4c61527ff04a','109e7d50-5606-4e0b-a6e1-307bdea8759f','ef431989-4338-481e-bef0-eaf962ca2cea','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('c53e7bf9-b672-4707-8a95-820195aa7dbb','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','7a3a5763-1fbb-4292-a678-6998a968048b','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('c5718d47-3ecc-4b5b-8196-4bacbbe059eb','109e7d50-5606-4e0b-a6e1-307bdea8759f','0adeabe7-dada-4a88-af71-2fdaa4d01dec','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('c8c2a559-9751-48c2-9bb2-23c9fe80af0a','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','27d95acc-f0d9-435d-b452-45cb06a6370a','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('ca08ddb1-70ee-4f3e-86a9-6c60f5064179','109e7d50-5606-4e0b-a6e1-307bdea8759f','13e0594b-f0ac-419a-8029-ab47424981f5','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('ccaa3609-2531-498f-997f-79f61d807846','109e7d50-5606-4e0b-a6e1-307bdea8759f','258e0393-6306-41e4-a9cc-d768a3247bbe','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('ce9cb0e3-cd49-4f61-91af-f639b70ef6b7','9dec13c5-fd50-4adf-9943-6ebbf1850c4e','a5742f41-68d3-4fce-985e-c0566b6afbc0','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('d3ea7c2e-d847-4bb1-b66d-f0e62e5b37c9','109e7d50-5606-4e0b-a6e1-307bdea8759f','7c9fe8e5-3fac-4de1-b4df-42adf019cff0','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('d5eb9921-6d7b-4082-8513-aabb0279013a','109e7d50-5606-4e0b-a6e1-307bdea8759f','c9cf27b8-a4dc-415e-a45e-cc262bb496cc','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('d7c6ef7e-b66a-4340-9888-eafc5b0eaa0e','109e7d50-5606-4e0b-a6e1-307bdea8759f','af21490c-324e-4e30-93dc-0cd776c56ece','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('d98d5ce1-0b65-4d54-bb9a-85c1e1ba27bf','109e7d50-5606-4e0b-a6e1-307bdea8759f','2442c172-d6ae-44c4-9f76-57a50320d1db','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('dd080a1c-562d-4d7b-9caa-53d6545b6792','109e7d50-5606-4e0b-a6e1-307bdea8759f','9a94ee38-f5e5-4eed-bba5-fb4607798f51','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('ed828766-3810-4bbf-9124-027de650fba7','109e7d50-5606-4e0b-a6e1-307bdea8759f','efbb871f-657e-460f-bb12-e9665d217b14','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('f12fb050-2b36-4d84-a4c6-45c514e288e9','109e7d50-5606-4e0b-a6e1-307bdea8759f','00564b76-d696-4700-b872-67fe6f7293c6','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25'),('f67f9c4c-61d1-4d30-bf89-139b25a64ce6','109e7d50-5606-4e0b-a6e1-307bdea8759f','564211dd-2c6f-4ccc-ae7e-9fdce5941408','00000000-0000-0000-0000-000000000001','2026-08-06 14:29:25');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `is_system` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('109e7d50-5606-4e0b-a6e1-307bdea8759f','00000000-0000-0000-0000-000000000001','Administrator','admin','System administrator',1,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL),('9dec13c5-fd50-4adf-9943-6ebbf1850c4e','00000000-0000-0000-0000-000000000001','Manager','manager','Full access manager role',1,1,'2026-08-06 14:29:25','2026-08-06 14:29:25',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stores` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `store_type` enum('main','branch','franchise','kiosk','popup','warehouse') COLLATE utf8mb4_unicode_ci DEFAULT 'branch',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'UAE',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Dubai',
  `opening_hours` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `parent_store_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `store_group` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  KEY `parent_store_id` (`parent_store_id`),
  CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `stores_ibfk_2` FOREIGN KEY (`parent_store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_modules`
--

DROP TABLE IF EXISTS `subscription_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_modules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `status` enum('enabled','disabled','hidden','beta') COLLATE utf8mb4_unicode_ci DEFAULT 'enabled',
  `sort_order` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_modules`
--

LOCK TABLES `subscription_modules` WRITE;
/*!40000 ALTER TABLE `subscription_modules` DISABLE KEYS */;
INSERT INTO `subscription_modules` VALUES ('2d130907-6d1d-4d33-947f-a9fcd2f3e89d','Gift Cards','gift_cards','Gift card issuance and management','commerce','enabled',8,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('3bb74df5-bdea-4c60-9367-de8b34fa5ab4','Audit Trail','audit_trail','Full audit logging','security','enabled',15,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('4d8af6ce-aa19-4322-ac51-5ca4c2fb01e3','Membership Tiers','membership','Multi-tier membership management','loyalty','enabled',4,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('59564ec6-f4b6-4570-8bb5-3dd28015c6bd','Coupons','coupons','Digital coupon management','marketing','enabled',7,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('656b71f4-38ab-4231-9b83-5a66c1aaf07b','Loyalty Points Engine','points_engine','Configurable points earning rules','loyalty','enabled',3,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('66b47e5d-97c5-48e1-af30-6817b6eaea6d','Multi-Store / Branch','multi_store','Multiple store/branch support','enterprise','enabled',16,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('7844878e-bf6b-4b57-b765-56ba8794e6a2','Campaigns & Promotions','campaigns','Marketing campaigns and promotions','marketing','enabled',6,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('84df93f4-cefb-4a86-af0c-0438e83a5b3b','Dashboard & Analytics','dashboard','Real-time dashboard and analytics','core','enabled',1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('8ff0cab4-80d4-4410-b355-8cb72a6a4605','White Label','white_label','Custom branding and domain','enterprise','beta',17,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('97877d4d-163b-48ef-84df-b35e397eca4e','Notifications','notifications','Email, SMS, Push notifications','communication','enabled',10,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('a4953b7c-8dbb-4cc7-a60f-0a61ba5be790','REST API Access','api_access','External API access for integrations','integration','enabled',13,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('b1713bae-a78b-4ee7-87c2-9e2401a7f9cd','Customer Management','customers','Customer profiles, segments, tags','core','enabled',2,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('b428ef05-a981-434c-8c11-e9bbf0585871','Referral Program','referrals','Customer referral tracking','marketing','enabled',9,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('c42ad98c-8ca7-47a6-ad97-e6c204ebfa84','Reward Catalog','rewards','Reward creation and redemption','loyalty','enabled',5,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('e6642e8c-62d2-48ee-86d8-f97803b84de5','POS Integration','pos_integration','Connect with POS systems','integration','enabled',11,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('e6f5e789-a38b-409e-83f5-5617151c4270','Reports','reports','Comprehensive reporting suite','analytics','enabled',14,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL),('f86db4c7-baf0-4b8d-9b54-2690f2018956','CRM Integration','crm_integration','Sync with CRM platforms','integration','enabled',12,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL);
/*!40000 ALTER TABLE `subscription_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plan_modules`
--

DROP TABLE IF EXISTS `subscription_plan_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_plan_modules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `plan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `module_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_plan_modules_planId_moduleId_unique` (`plan_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `subscription_plan_modules_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `subscription_plan_modules_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `subscription_modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plan_modules`
--

LOCK TABLES `subscription_plan_modules` WRITE;
/*!40000 ALTER TABLE `subscription_plan_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_plan_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_plans` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) DEFAULT '0.00',
  `billing_cycle` enum('monthly','quarterly','biannual','annual') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `max_companies` int(11) DEFAULT '1',
  `max_users` int(11) DEFAULT '5',
  `max_customers` int(11) DEFAULT '100',
  `max_api_calls` int(11) DEFAULT '1000',
  `storage_limit_mb` int(11) DEFAULT '100',
  `features` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `subscription_plans_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES ('537ac214-3086-4965-8a75-bf0d09568427','Enterprise','enterprise','For large enterprises with unlimited possibilities',299.00,'monthly',5,50,50000,500000,2000,NULL,1,3,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL,NULL),('5f838ce2-4e26-43ef-a1e8-3f53c3f0fab7','Custom','custom','Tailored solution for unique requirements',0.00,'monthly',1,999,999999,9999999,10000,NULL,1,4,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL,NULL),('ab686f70-5435-4f12-ba94-d65e7b28e35e','Professional','professional','For growing businesses with advanced loyalty needs',99.00,'monthly',1,10,5000,50000,500,NULL,1,2,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL,NULL),('b24f000e-4866-40b2-b32c-1a795301b397','Starter','starter','For small businesses getting started with loyalty',0.00,'monthly',1,3,500,5000,100,NULL,1,1,'2026-08-06 14:29:26','2026-08-06 14:29:26',NULL,NULL);
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super_admin_settings`
--

DROP TABLE IF EXISTS `super_admin_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `super_admin_settings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admin_settings`
--

LOCK TABLES `super_admin_settings` WRITE;
/*!40000 ALTER TABLE `super_admin_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `super_admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_responses`
--

DROP TABLE IF EXISTS `survey_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_responses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `survey_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `customer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `answers` json DEFAULT NULL,
  `nps_score` int(11) DEFAULT NULL,
  `satisfaction_score` int(11) DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `points_awarded` int(11) DEFAULT '0',
  `store_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_id` (`survey_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_responses`
--

LOCK TABLES `survey_responses` WRITE;
/*!40000 ALTER TABLE `survey_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `surveys` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `survey_type` enum('nps','satisfaction','product_review','store_rating','service_rating','feedback','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'satisfaction',
  `questions` json DEFAULT NULL,
  `reward_points` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `trigger_event` enum('after_purchase','after_redemption','tier_upgrade','manual','scheduled') COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `target_segments` json DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `surveys_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usage_tracking`
--

DROP TABLE IF EXISTS `usage_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usage_tracking` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `date` date NOT NULL,
  `api_calls` int(11) DEFAULT '0',
  `transactions` int(11) DEFAULT '0',
  `storage_used_mb` decimal(10,2) DEFAULT '0.00',
  `active_users` int(11) DEFAULT '0',
  `active_customers` int(11) DEFAULT '0',
  `points_issued` int(11) DEFAULT '0',
  `points_redeemed` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `usage_tracking_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usage_tracking`
--

LOCK TABLES `usage_tracking` WRITE;
/*!40000 ALTER TABLE `usage_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `usage_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_userId_roleId_unique` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_locked` tinyint(1) DEFAULT '0',
  `is_super_admin` tinyint(1) DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `last_password_change` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT '0',
  `refresh_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('8a6bee69-cdcb-4693-b82d-bbd6ae395b32','00000000-0000-0000-0000-000000000001','superadmin','superadmin@ezeeflo.com','$2a$12$mAq8VL0dO1Hx7nKECAfGAefqGb4v3II6mddT2TEaeIHKT3XZNIia.','Super','Admin',NULL,NULL,1,0,1,'2026-08-27 17:16:02',NULL,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTZiZWU2OS1jZGNiLTQ2OTMtYjgyZC1iYmQ2YWUzOTViMzIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NzgzNjU2MiwiZXhwIjoxNzg4NDQxMzYyfQ.XcA-4gFmiUT22pSs8yeIjzMdPEQVpaQV209YtpxCyLs',NULL,NULL,1,'en','2026-08-06 14:29:25','2026-08-27 17:16:02',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhook_logs`
--

DROP TABLE IF EXISTS `webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `webhook_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `webhook_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `event` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json DEFAULT NULL,
  `status` enum('success','failed','pending','retrying') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `status_code` int(11) DEFAULT NULL,
  `response_body` text COLLATE utf8mb4_unicode_ci,
  `attempt_count` int(11) DEFAULT '1',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhook_logs`
--

LOCK TABLES `webhook_logs` WRITE;
/*!40000 ALTER TABLE `webhook_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `webhooks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `events` json NOT NULL,
  `secret` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `retry_count` int(11) DEFAULT '3',
  `success_count` int(11) DEFAULT '0',
  `failure_count` int(11) DEFAULT '0',
  `last_triggered_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webhooks`
--

LOCK TABLES `webhooks` WRITE;
/*!40000 ALTER TABLE `webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ezeeflo_loyalty'
--

--
-- Dumping routines for database 'ezeeflo_loyalty'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-27 17:17:11
