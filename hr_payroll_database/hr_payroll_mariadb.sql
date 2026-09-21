-- MySQL dump 10.13  Distrib 5.7.16, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: ezeeflo_hr_payroll
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
-- Table structure for table `allowance_types`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `allowance_types` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `allowance_category` enum('Fixed','Variable','Recurring','OneTime') DEFAULT 'Fixed',
  `is_taxable` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `allowance_types_tenant_id_code` (`tenant_id`,`code`),
  KEY `allowance_types_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowance_types`
--

LOCK TABLES `allowance_types` WRITE;
/*!40000 ALTER TABLE `allowance_types` DISABLE KEYS */;
INSERT INTO `allowance_types` VALUES ('1157cdb9-04fd-4946-8b91-f428e33bc505','11111111-1111-1111-1111-111111111111','SPA','Special Allowance','',1,1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('3e8a4a59-a7dd-4534-add8-62c54de3cff4','11111111-1111-1111-1111-111111111111','DA','Dearness Allowance','',1,1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('554d3666-efa8-4114-9cf5-11b15781a7b5','11111111-1111-1111-1111-111111111111','TRA','Transport Allowance','',0,1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('a1f93164-d5a1-4452-8cfb-dff466d0f847','11111111-1111-1111-1111-111111111111','MA','Medical Allowance','',0,1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('d1158793-56ac-4e62-a701-f6e1ba242441','11111111-1111-1111-1111-111111111111','HRA','Housing Allowance','',0,1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL);
/*!40000 ALTER TABLE `allowance_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendances`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendances` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `shift_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `check_in_method` enum('Manual','Biometric','GPS','Mobile','Face','Web') DEFAULT 'Manual',
  `check_out_method` enum('Manual','Biometric','GPS','Mobile','Face','Web') DEFAULT 'Manual',
  `check_in_location` varchar(255) DEFAULT NULL,
  `check_out_location` varchar(255) DEFAULT NULL,
  `status` enum('Present','Absent','Late','Half Day','Weekly Off','Holiday','On Leave') NOT NULL DEFAULT 'Present',
  `late_minutes` int(11) DEFAULT '0',
  `early_leaving_minutes` int(11) DEFAULT '0',
  `overtime_minutes` int(11) DEFAULT '0',
  `total_worked_minutes` int(11) DEFAULT '0',
  `is_manual_entry` tinyint(1) DEFAULT '0',
  `remarks` text,
  `approved_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendances_tenant_id_employee_id_attendance_date` (`tenant_id`,`employee_id`,`attendance_date`),
  KEY `attendances_tenant_id` (`tenant_id`),
  KEY `attendances_employee_id` (`employee_id`),
  KEY `attendances_attendance_date` (`attendance_date`),
  KEY `attendances_status` (`status`),
  KEY `attendances_shift_id` (`shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendances`
--

LOCK TABLES `attendances` WRITE;
/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
INSERT INTO `attendances` VALUES ('0eb591d2-36c6-4193-a482-66977df49e29','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3',NULL,'2026-07-29','2026-07-29 14:17:41','2026-07-30 11:01:11','Manual','Manual',NULL,NULL,'Present',0,0,0,1244,1,NULL,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:17:41','2026-07-30 11:01:12',NULL),('3289cf00-e6fe-4a30-94f8-50502dbea380','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','cd7d32dd-dce1-40d4-8589-6f8577d554a8','2026-07-30','2026-07-30 11:00:09','2026-07-31 16:51:59','Manual','Manual',NULL,NULL,'Present',0,0,0,1792,1,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:00:09','2026-07-31 16:51:59',NULL);
/*!40000 ALTER TABLE `attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `benefit_types`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `benefit_types` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `benefit_category` enum('Medical','Insurance','Travel','Education','Housing','Transportation','Other') NOT NULL,
  `provider_name` varchar(200) DEFAULT NULL,
  `coverage_details` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `benefit_types_tenant_id_code` (`tenant_id`,`code`),
  KEY `benefit_types_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `benefit_types`
--

LOCK TABLES `benefit_types` WRITE;
/*!40000 ALTER TABLE `benefit_types` DISABLE KEYS */;
INSERT INTO `benefit_types` VALUES ('fa9f7969-8dac-49b4-9cfc-9a684c48b588','11111111-1111-1111-1111-111111111111','M001','Medical Insurance','Medical',NULL,NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:13:30','2026-07-29 15:13:30',NULL);
/*!40000 ALTER TABLE `benefit_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branches` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_head_office` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_branch_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `branches_tenant_id_code` (`tenant_id`,`code`),
  KEY `idx_branch_tenant` (`tenant_id`),
  KEY `branches_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES ('8815c8d5-99cd-40e0-a743-07aecbc17aaf','11111111-1111-1111-1111-111111111111','HQ','Dubai Headquarters',NULL,NULL,'Dubai','Dubai','UAE','+971 4 123 4567','hq@ezee.com',1,1,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:14:31','2026-07-30 10:56:42',NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_centers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cost_centers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cc_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `cost_centers_tenant_id_code` (`tenant_id`,`code`),
  KEY `idx_cc_tenant` (`tenant_id`),
  KEY `idx_cc_dept` (`department_id`),
  KEY `cost_centers_tenant_id` (`tenant_id`),
  KEY `cost_centers_department_id` (`department_id`),
  CONSTRAINT `cost_centers_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_centers`
--

LOCK TABLES `cost_centers` WRITE;
/*!40000 ALTER TABLE `cost_centers` DISABLE KEYS */;
INSERT INTO `cost_centers` VALUES ('3fae8f15-b31a-4804-85f5-894c6e3e606c','11111111-1111-1111-1111-111111111111','IT-CC','IT Department CC',NULL,'f3322dda-fc16-47fe-a671-d920addfc6be',NULL,1,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:14:53','2026-07-30 10:56:28',NULL);
/*!40000 ALTER TABLE `cost_centers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deduction_types`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deduction_types` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `deduction_category` enum('Loan','Absence','Late','Penalty','Insurance','Other') DEFAULT 'Other',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deduction_types_tenant_id_code` (`tenant_id`,`code`),
  KEY `deduction_types_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deduction_types`
--

LOCK TABLES `deduction_types` WRITE;
/*!40000 ALTER TABLE `deduction_types` DISABLE KEYS */;
INSERT INTO `deduction_types` VALUES ('0573d8b3-b65a-461c-a1ba-45116865373d','11111111-1111-1111-1111-111111111111','ABS','Absent Deduction','',1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('08ad3412-a276-4d6e-b7da-d8fb33a1f8e6','11111111-1111-1111-1111-111111111111','LOAN','Loan Repayment','Loan',1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('772e11de-2424-4f5e-b067-006bcb4f5c2b','11111111-1111-1111-1111-111111111111','PF','Provident Fund','',1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('b4cdf6cf-946d-4b06-bdcd-848d25c15424','11111111-1111-1111-1111-111111111111','TAX','Income Tax','',1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL),('d7e2c5ac-22b6-45a8-9bc7-9554876ce21d','11111111-1111-1111-1111-111111111111','INS','Medical Insurance','Insurance',1,NULL,NULL,'2026-07-29 16:30:52','2026-07-29 16:30:52',NULL);
/*!40000 ALTER TABLE `deduction_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_dept_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `departments_tenant_id_code` (`tenant_id`,`code`),
  KEY `idx_dept_tenant` (`tenant_id`),
  KEY `idx_dept_branch` (`branch_id`),
  KEY `idx_dept_parent` (`parent_id`),
  KEY `departments_tenant_id` (`tenant_id`),
  KEY `departments_branch_id` (`branch_id`),
  KEY `departments_parent_id` (`parent_id`),
  KEY `manager_id` (`manager_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `departments_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `departments_ibfk_3` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES ('a9bd8c6d-95e2-4df1-a8e2-60fe3ead4b2f','11111111-1111-1111-1111-111111111111','TSLLC1','Testing Solutions LLC',NULL,NULL,NULL,NULL,NULL,1,0,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 12:07:42','2026-07-29 12:08:26','2026-07-29 12:08:26'),('f3322dda-fc16-47fe-a671-d920addfc6be','11111111-1111-1111-1111-111111111111','IT','Information Technology',NULL,'f3322dda-fc16-47fe-a671-d920addfc6be','8815c8d5-99cd-40e0-a743-07aecbc17aaf','f06c80f6-926c-4c6c-a6d0-1b54814785e3',NULL,1,0,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:14:50','2026-07-30 10:55:24',NULL);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `designations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_desig_tenant_code` (`tenant_id`,`code`),
  UNIQUE KEY `designations_tenant_id_code` (`tenant_id`,`code`),
  KEY `idx_desig_tenant` (`tenant_id`),
  KEY `idx_desig_dept` (`department_id`),
  KEY `designations_tenant_id` (`tenant_id`),
  KEY `designations_department_id` (`department_id`),
  CONSTRAINT `designations_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES ('95b58e98-cb3d-40c8-b4d4-8f2a33c672a3','11111111-1111-1111-1111-111111111111','SE','Software Engineer',NULL,'f3322dda-fc16-47fe-a671-d920addfc6be','Manager',NULL,1,0,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:14:41','2026-07-30 10:58:57',NULL);
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_allowances`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_allowances` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `allowance_type_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_allowances_tenant_id` (`tenant_id`),
  KEY `employee_allowances_employee_id` (`employee_id`),
  KEY `employee_allowances_allowance_type_id` (`allowance_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_allowances`
--

LOCK TABLES `employee_allowances` WRITE;
/*!40000 ALTER TABLE `employee_allowances` DISABLE KEYS */;
INSERT INTO `employee_allowances` VALUES ('6f278ab9-cd1b-4919-a2d4-61d771b75c7d','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','1157cdb9-04fd-4946-8b91-f428e33bc505',3000.00,'2026-07-29',NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:34:49','2026-07-29 16:34:49',NULL);
/*!40000 ALTER TABLE `employee_allowances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_benefits`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_benefits` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `benefit_type_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `enrolled_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `coverage_amount` decimal(12,2) DEFAULT '0.00',
  `employer_contribution` decimal(12,2) DEFAULT '0.00',
  `employee_contribution` decimal(12,2) DEFAULT '0.00',
  `status` enum('Active','Inactive','Expired','Cancelled') DEFAULT 'Active',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_benefits_tenant_id` (`tenant_id`),
  KEY `employee_benefits_employee_id` (`employee_id`),
  KEY `employee_benefits_benefit_type_id` (`benefit_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_benefits`
--

LOCK TABLES `employee_benefits` WRITE;
/*!40000 ALTER TABLE `employee_benefits` DISABLE KEYS */;
INSERT INTO `employee_benefits` VALUES ('ae1b0664-1e02-473d-a9c3-e670f347bf99','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','fa9f7969-8dac-49b4-9cfc-9a684c48b588','2026-01-01','2026-12-31',100000.00,20.00,80.00,'Active',NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:14:11','2026-07-29 15:14:11',NULL);
/*!40000 ALTER TABLE `employee_benefits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_deductions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_deductions` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `deduction_type_id` char(36) DEFAULT NULL,
  `loan_id` char(36) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_deductions_tenant_id` (`tenant_id`),
  KEY `employee_deductions_employee_id` (`employee_id`),
  KEY `employee_deductions_deduction_type_id` (`deduction_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_deductions`
--

LOCK TABLES `employee_deductions` WRITE;
/*!40000 ALTER TABLE `employee_deductions` DISABLE KEYS */;
INSERT INTO `employee_deductions` VALUES ('0a6aca1a-d461-4383-ba8e-e39387b3018b','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','08ad3412-a276-4d6e-b7da-d8fb33a1f8e6',NULL,2000.00,'2026-07-29',NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:48:41','2026-07-29 23:51:31','2026-07-29 23:51:31'),('7d92ff70-9166-4e36-b16e-8e24266ebf03','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','08ad3412-a276-4d6e-b7da-d8fb33a1f8e6',NULL,2000.00,'2026-07-30',NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 00:09:47','2026-07-30 00:10:55','2026-07-30 00:10:55'),('acb41717-4369-40a3-bb24-ffc34ed02255','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','08ad3412-a276-4d6e-b7da-d8fb33a1f8e6',NULL,20000.00,'2026-07-29',NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:52:42','2026-07-29 23:53:54','2026-07-29 23:53:54'),('e058e961-0c35-48f3-aef6-e1cacd3f6fa9','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','08ad3412-a276-4d6e-b7da-d8fb33a1f8e6','780b9805-9891-4688-af44-93e23e2cc3f9',2000.00,'2026-07-30',NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 00:15:14','2026-07-30 00:15:14',NULL),('fbd60cd9-2d55-4f26-9172-4912f1d0d04d','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','08ad3412-a276-4d6e-b7da-d8fb33a1f8e6',NULL,2000.00,'2026-07-29',NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:51:45','2026-07-29 23:52:11','2026-07-29 23:52:11');
/*!40000 ALTER TABLE `employee_deductions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_documents`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_documents` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employee_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('Contract','Passport','Visa','EmiratesID','LaborCard','Certificate','OfferLetter','Warning','Other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_doc_tenant` (`tenant_id`),
  KEY `idx_doc_employee` (`employee_id`),
  KEY `idx_doc_type` (`document_type`),
  KEY `idx_doc_expiry` (`expiry_date`),
  KEY `employee_documents_tenant_id` (`tenant_id`),
  KEY `employee_documents_employee_id` (`employee_id`),
  KEY `employee_documents_document_type` (`document_type`),
  KEY `employee_documents_expiry_date` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_documents`
--

LOCK TABLES `employee_documents` WRITE;
/*!40000 ALTER TABLE `employee_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_loans`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_loans` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `loan_number` varchar(30) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `loan_type` enum('Personal','Housing','Vehicle','Education','Medical','Other') DEFAULT 'Personal',
  `principal_amount` decimal(12,2) NOT NULL,
  `interest_rate` decimal(5,2) DEFAULT '0.00',
  `monthly_installment` decimal(12,2) NOT NULL,
  `total_installments` int(11) NOT NULL,
  `paid_installments` int(11) DEFAULT '0',
  `remaining_amount` decimal(12,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Pending','Approved','Active','Closed','Suspended','Rejected') DEFAULT 'Pending',
  `approved_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_loans_tenant_id` (`tenant_id`),
  KEY `employee_loans_employee_id` (`employee_id`),
  KEY `employee_loans_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_loans`
--

LOCK TABLES `employee_loans` WRITE;
/*!40000 ALTER TABLE `employee_loans` DISABLE KEYS */;
INSERT INTO `employee_loans` VALUES ('780b9805-9891-4688-af44-93e23e2cc3f9','11111111-1111-1111-1111-111111111111','LN-2026-72343','f06c80f6-926c-4c6c-a6d0-1b54814785e3','Personal',10000.00,0.00,2000.00,5,1,8000.00,'2026-01-07',NULL,'Active','610d0b41-8811-4a49-b42e-90bd14c9f055',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-30 00:15:14',NULL);
/*!40000 ALTER TABLE `employee_loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_salaries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_salaries` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `structure_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `gross_salary` decimal(12,2) DEFAULT '0.00',
  `net_salary` decimal(12,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'AED',
  `payment_mode` enum('Bank Transfer','Cash','Cheque','WPS') DEFAULT 'Bank Transfer',
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_salaries_tenant_id` (`tenant_id`),
  KEY `employee_salaries_employee_id` (`employee_id`),
  KEY `employee_salaries_structure_id` (`structure_id`),
  KEY `employee_salaries_effective_from` (`effective_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salaries`
--

LOCK TABLES `employee_salaries` WRITE;
/*!40000 ALTER TABLE `employee_salaries` DISABLE KEYS */;
INSERT INTO `employee_salaries` VALUES ('31e46150-0487-422d-ae1f-8f06af78c030','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','9351dd7b-0b01-4eda-99a1-87f0c78948eb','2026-07-29',NULL,5000.00,3000.00,3000.00,'AED','Bank Transfer','Dubai',NULL,'00000',1,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 16:23:16','2026-07-30 00:15:59',NULL);
/*!40000 ALTER TABLE `employee_salaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employee_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name_ar` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('Male','Female','Other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `place_of_birth` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` enum('Single','Married','Divorced','Widowed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personal_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_relation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_issue_date` date DEFAULT NULL,
  `passport_expiry_date` date DEFAULT NULL,
  `passport_issue_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visa_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visa_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visa_issue_date` date DEFAULT NULL,
  `visa_expiry_date` date DEFAULT NULL,
  `visa_issue_place` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emirates_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emirates_id_expiry_date` date DEFAULT NULL,
  `labor_card_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `labor_card_expiry_date` date DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `confirmation_date` date DEFAULT NULL,
  `contract_start_date` date DEFAULT NULL,
  `contract_end_date` date DEFAULT NULL,
  `contract_type` enum('Limited','Unlimited','Part-Time','Contractor','Intern','Probation') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_type` enum('Full-Time','Part-Time','Contract','Temporary','Intern','Consultant') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `probation_end_date` date DEFAULT NULL,
  `resignation_date` date DEFAULT NULL,
  `last_working_date` date DEFAULT NULL,
  `termination_date` date DEFAULT NULL,
  `termination_reason` text COLLATE utf8mb4_unicode_ci,
  `department_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost_center_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporting_manager_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basic_salary` decimal(12,2) DEFAULT '0.00',
  `housing_allowance` decimal(12,2) DEFAULT '0.00',
  `transport_allowance` decimal(12,2) DEFAULT '0.00',
  `other_allowances` decimal(12,2) DEFAULT '0.00',
  `total_salary` decimal(12,2) DEFAULT '0.00',
  `salary_currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'AED',
  `bank_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iban` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wps_agent_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Inactive','On Leave','Suspended','Terminated','Resigned','Retired') COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_emp_tenant_code` (`tenant_id`,`employee_code`),
  UNIQUE KEY `employees_tenant_id_employee_code` (`tenant_id`,`employee_code`),
  KEY `idx_emp_tenant` (`tenant_id`),
  KEY `idx_emp_dept` (`department_id`),
  KEY `idx_emp_desig` (`designation_id`),
  KEY `idx_emp_branch` (`branch_id`),
  KEY `idx_emp_cost_center` (`cost_center_id`),
  KEY `idx_emp_manager` (`reporting_manager_id`),
  KEY `idx_emp_status` (`status`),
  KEY `idx_emp_joining` (`joining_date`),
  KEY `idx_emp_contract_end` (`contract_end_date`),
  KEY `employees_tenant_id` (`tenant_id`),
  KEY `employees_department_id` (`department_id`),
  KEY `employees_designation_id` (`designation_id`),
  KEY `employees_branch_id` (`branch_id`),
  KEY `employees_cost_center_id` (`cost_center_id`),
  KEY `employees_reporting_manager_id` (`reporting_manager_id`),
  KEY `employees_status` (`status`),
  KEY `employees_joining_date` (`joining_date`),
  KEY `employees_contract_end_date` (`contract_end_date`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_4` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_ibfk_5` FOREIGN KEY (`reporting_manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES ('f06c80f6-926c-4c6c-a6d0-1b54814785e3','11111111-1111-1111-1111-111111111111','EMP-000001','John',NULL,'Doe',NULL,'Male',NULL,NULL,'Pakistani',NULL,'Married',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Pakistan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-15',NULL,NULL,NULL,NULL,'Full-Time',NULL,NULL,NULL,NULL,NULL,'f3322dda-fc16-47fe-a671-d920addfc6be','95b58e98-cb3d-40c8-b4d4-8f2a33c672a3','8815c8d5-99cd-40e0-a743-07aecbc17aaf',NULL,'f06c80f6-926c-4c6c-a6d0-1b54814785e3',NULL,NULL,NULL,NULL,NULL,'AED',NULL,NULL,NULL,NULL,NULL,'Active',NULL,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 12:35:16','2026-07-30 10:58:12',NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eosb_calculations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eosb_calculations` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `calculation_date` date NOT NULL,
  `joining_date` date NOT NULL,
  `last_working_date` date NOT NULL,
  `years_of_service` decimal(5,2) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `termination_type` enum('Resignation','Termination','Retirement','Death','ContractEnd') NOT NULL,
  `daily_wage` decimal(10,2) DEFAULT '0.00',
  `first_5_years_amount` decimal(12,2) DEFAULT '0.00',
  `after_5_years_amount` decimal(12,2) DEFAULT '0.00',
  `total_eosb_amount` decimal(12,2) DEFAULT '0.00',
  `max_cap_amount` decimal(12,2) DEFAULT '0.00' COMMENT '2 years salary cap per UAE law',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eosb_calculations_tenant_id` (`tenant_id`),
  KEY `eosb_calculations_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eosb_calculations`
--

LOCK TABLES `eosb_calculations` WRITE;
/*!40000 ALTER TABLE `eosb_calculations` DISABLE KEYS */;
INSERT INTO `eosb_calculations` VALUES ('2549ac91-5a54-4dab-b3ec-e4756b8864dd','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-01-15','2026-07-30',0.54,0.00,'Termination',0.00,0.00,0.00,0.00,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:28:35','2026-07-30 11:32:24','2026-07-30 11:32:24'),('9d84bb5c-45ea-4664-be6b-fceeada24ca0','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-01-15','2026-07-30',0.54,0.00,'Termination',0.00,0.00,0.00,0.00,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:32:31','2026-07-30 11:32:31',NULL),('a1ee7d47-0122-47cc-a7e9-1ca31f2c2926','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-01-15','2026-07-30',0.54,0.00,'ContractEnd',0.00,0.00,0.00,0.00,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:25:48','2026-07-30 11:26:22','2026-07-30 11:26:22'),('aade7a96-c218-4b10-a56d-1a565a45ec18','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-01-15','2026-07-30',0.54,0.00,'Resignation',0.00,0.00,0.00,0.00,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:27:25','2026-07-30 11:27:25','2026-07-30 11:32:31'),('bea4547d-ea80-459a-88e0-013171c1c751','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-01-15','2026-07-30',0.54,0.00,'Resignation',0.00,0.00,0.00,0.00,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:25:36','2026-07-30 11:26:21','2026-07-30 11:26:21'),('e93310e6-194f-4e90-8492-549518672383','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-29','2026-01-15','2026-07-29',0.53,0.00,'Resignation',0.00,0.00,0.00,0.00,0.00,NULL,'00000000-0000-0000-0000-000000000001','2026-07-29 15:34:20','2026-07-30 11:26:19','2026-07-30 11:26:19');
/*!40000 ALTER TABLE `eosb_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eosb_settlements`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `eosb_settlements` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `settlement_number` varchar(30) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `calculation_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `settlement_date` date NOT NULL,
  `eosb_amount` decimal(12,2) DEFAULT '0.00',
  `leave_encashment` decimal(12,2) DEFAULT '0.00',
  `gratuity_amount` decimal(12,2) DEFAULT '0.00',
  `other_dues` decimal(12,2) DEFAULT '0.00',
  `deductions` decimal(12,2) DEFAULT '0.00',
  `net_settlement` decimal(12,2) DEFAULT '0.00',
  `payment_mode` enum('Bank Transfer','Cash','Cheque') DEFAULT 'Bank Transfer',
  `status` enum('Draft','Calculated','Approved','Paid') DEFAULT 'Draft',
  `approved_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eosb_settlements_tenant_id` (`tenant_id`),
  KEY `eosb_settlements_employee_id` (`employee_id`),
  KEY `eosb_settlements_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eosb_settlements`
--

LOCK TABLES `eosb_settlements` WRITE;
/*!40000 ALTER TABLE `eosb_settlements` DISABLE KEYS */;
INSERT INTO `eosb_settlements` VALUES ('046a8eba-4c73-4aa4-9003-ff3870bdaa47','11111111-1111-1111-1111-111111111111','ES-2026-87038','f06c80f6-926c-4c6c-a6d0-1b54814785e3',NULL,'2026-07-29',0.00,0.00,0.00,0.00,0.00,0.00,'Bank Transfer','Calculated',NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:12:39','2026-07-29 16:12:39',NULL);
/*!40000 ALTER TABLE `eosb_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ess_submissions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ess_submissions` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `request_type` enum('Leave','Loan','Document','ProfileUpdate','Payslip','Attendance','Other') NOT NULL,
  `reference_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `status` enum('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  `reviewed_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `remarks` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ess_submissions_tenant_id` (`tenant_id`),
  KEY `ess_submissions_employee_id` (`employee_id`),
  KEY `ess_submissions_request_type` (`request_type`),
  KEY `ess_submissions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ess_submissions`
--

LOCK TABLES `ess_submissions` WRITE;
/*!40000 ALTER TABLE `ess_submissions` DISABLE KEYS */;
INSERT INTO `ess_submissions` VALUES ('11efb815-f868-41a6-8312-48c6d0c02b16','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','Loan',NULL,'Need loan for my car',NULL,'Approved','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:36:47',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:36:42','2026-07-30 11:36:47',NULL),('414b708e-b292-4874-a4be-4007a686d492','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','Document',NULL,'Testing document is required',NULL,'Pending',NULL,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:36:13','2026-07-30 11:36:13',NULL);
/*!40000 ALTER TABLE `ess_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exit_interviews`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exit_interviews` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `interview_date` date NOT NULL,
  `reason_for_leaving` text,
  `new_employer` varchar(200) DEFAULT NULL,
  `new_position` varchar(200) DEFAULT NULL,
  `feedback` text,
  `rehire_recommendation` tinyint(1) DEFAULT NULL,
  `interviewer_id` char(36) DEFAULT NULL,
  `status` enum('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ei_tenant` (`tenant_id`),
  KEY `idx_ei_employee` (`employee_id`),
  KEY `exit_interviews_tenant_id` (`tenant_id`),
  KEY `exit_interviews_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exit_interviews`
--

LOCK TABLES `exit_interviews` WRITE;
/*!40000 ALTER TABLE `exit_interviews` DISABLE KEYS */;
INSERT INTO `exit_interviews` VALUES ('9ae62f74-f01c-4aef-8dc3-0133f9b88b05','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-08-20',NULL,NULL,NULL,NULL,0,NULL,'Scheduled','00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 15:52:45','2026-07-30 13:35:23',NULL);
/*!40000 ALTER TABLE `exit_interviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `holidays` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name` varchar(150) NOT NULL,
  `name_ar` varchar(150) DEFAULT NULL,
  `holiday_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_recurring_yearly` tinyint(1) DEFAULT '0',
  `holiday_type` enum('Public','Religious','National','Company') DEFAULT 'Public',
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `holidays_tenant_id` (`tenant_id`),
  KEY `holidays_holiday_date` (`holiday_date`),
  KEY `holidays_holiday_type` (`holiday_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES ('ebe0e07b-b4e4-4614-80a9-877569838b08','11111111-1111-1111-1111-111111111111','New Year',NULL,'2027-01-01',NULL,0,'Public',NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:58:11','2026-07-29 15:58:11',NULL);
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interviews`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interviews` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `applicant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `interview_date` date NOT NULL,
  `interview_time` time DEFAULT NULL,
  `interviewer_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `interview_type` enum('Phone','Video','InPerson','Technical','HR') DEFAULT 'InPerson',
  `round_number` int(11) DEFAULT '1',
  `status` enum('Scheduled','Completed','Cancelled','NoShow') DEFAULT 'Scheduled',
  `rating` int(11) DEFAULT NULL COMMENT '1-5 rating',
  `feedback` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `interviews_tenant_id` (`tenant_id`),
  KEY `interviews_applicant_id` (`applicant_id`),
  KEY `interviews_interview_date` (`interview_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviews`
--

LOCK TABLES `interviews` WRITE;
/*!40000 ALTER TABLE `interviews` DISABLE KEYS */;
INSERT INTO `interviews` VALUES ('ef520802-c671-4fe1-a88f-279f028e2528','11111111-1111-1111-1111-111111111111','c024b074-1ceb-450c-8a08-4fcad0e1a82a','2026-08-05',NULL,NULL,'InPerson',1,'Scheduled',NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:50:52','2026-07-29 15:50:52',NULL);
/*!40000 ALTER TABLE `interviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_applicants`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_applicants` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `position_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `applicant_number` varchar(30) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `resume_path` varchar(500) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `current_company` varchar(200) DEFAULT NULL,
  `current_salary` decimal(10,2) DEFAULT NULL,
  `expected_salary` decimal(10,2) DEFAULT NULL,
  `source` enum('LinkedIn','Website','Referral','Agency','JobPortal','Other') DEFAULT 'Website',
  `status` enum('Applied','Shortlisted','Interviewed','Offered','Hired','Rejected') DEFAULT 'Applied',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_applicants_tenant_id` (`tenant_id`),
  KEY `job_applicants_position_id` (`position_id`),
  KEY `job_applicants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_applicants`
--

LOCK TABLES `job_applicants` WRITE;
/*!40000 ALTER TABLE `job_applicants` DISABLE KEYS */;
INSERT INTO `job_applicants` VALUES ('c024b074-1ceb-450c-8a08-4fcad0e1a82a','11111111-1111-1111-1111-111111111111','590c6b0b-7cb4-456b-8087-5f3c09ec6ff4','APP-2026-83892','Jane','Smith','jane.smith@email.com',NULL,NULL,3,NULL,NULL,NULL,'Website','Applied',NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 15:50:22','2026-07-30 13:36:37',NULL);
/*!40000 ALTER TABLE `job_applicants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_positions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_positions` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `position_code` varchar(30) NOT NULL,
  `title` varchar(200) NOT NULL,
  `department_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `designation_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `vacancies` int(11) DEFAULT '1',
  `min_experience` int(11) DEFAULT '0',
  `max_experience` int(11) DEFAULT NULL,
  `min_salary` decimal(10,2) DEFAULT NULL,
  `max_salary` decimal(10,2) DEFAULT NULL,
  `posting_date` date DEFAULT NULL,
  `closing_date` date DEFAULT NULL,
  `status` enum('Draft','Open','Closed','Filled','Cancelled') DEFAULT 'Draft',
  `description` text,
  `requirements` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_positions_tenant_id` (`tenant_id`),
  KEY `job_positions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_positions`
--

LOCK TABLES `job_positions` WRITE;
/*!40000 ALTER TABLE `job_positions` DISABLE KEYS */;
INSERT INTO `job_positions` VALUES ('590c6b0b-7cb4-456b-8087-5f3c09ec6ff4','11111111-1111-1111-1111-111111111111','POS-001','Software Engineer','f3322dda-fc16-47fe-a671-d920addfc6be','95b58e98-cb3d-40c8-b4d4-8f2a33c672a3',1,4,10,NULL,NULL,NULL,NULL,'Draft',NULL,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 15:41:02','2026-07-30 13:36:21',NULL);
/*!40000 ALTER TABLE `job_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_applications`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_applications` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `application_number` varchar(30) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `leave_type_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(5,1) DEFAULT '0.0',
  `reason` text,
  `status` enum('Draft','Submitted','Approved','Rejected','Cancelled') DEFAULT 'Draft',
  `contact_details` varchar(200) DEFAULT NULL,
  `attachment_path` varchar(500) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_applications_tenant_id` (`tenant_id`),
  KEY `leave_applications_employee_id` (`employee_id`),
  KEY `leave_applications_leave_type_id` (`leave_type_id`),
  KEY `leave_applications_status` (`status`),
  KEY `leave_applications_start_date_end_date` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
INSERT INTO `leave_applications` VALUES ('07335776-f129-4844-9ca7-978185e5374b','11111111-1111-1111-1111-111111111111','LA-000001','f06c80f6-926c-4c6c-a6d0-1b54814785e3','57d405bd-093f-4b1f-b677-5667f5465dd8','2026-08-01','2026-08-02',2.0,'Family vacation','Rejected',NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 14:18:03','2026-07-30 11:02:56',NULL),('1a4a3c63-d611-48da-9d81-8cb26a19d999','11111111-1111-1111-1111-111111111111','LA-000002','f06c80f6-926c-4c6c-a6d0-1b54814785e3','57d405bd-093f-4b1f-b677-5667f5465dd8','2026-08-15','2026-08-17',3.0,NULL,'Approved',NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 15:57:32','2026-07-29 22:57:04',NULL);
/*!40000 ALTER TABLE `leave_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_approvals`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_approvals` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `leave_application_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `approver_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `approval_level` int(11) DEFAULT '1',
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `comments` text,
  `decided_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_approvals_tenant_id` (`tenant_id`),
  KEY `leave_approvals_leave_application_id` (`leave_application_id`),
  KEY `leave_approvals_approver_id` (`approver_id`),
  KEY `leave_approvals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_approvals`
--

LOCK TABLES `leave_approvals` WRITE;
/*!40000 ALTER TABLE `leave_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_balances`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_balances` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `leave_type_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `year` int(11) NOT NULL,
  `opening_balance` decimal(5,1) DEFAULT '0.0',
  `accrued_days` decimal(5,1) DEFAULT '0.0',
  `used_days` decimal(5,1) DEFAULT '0.0',
  `pending_days` decimal(5,1) DEFAULT '0.0',
  `available_balance` decimal(5,1) DEFAULT '0.0',
  `carry_forward_days` decimal(5,1) DEFAULT '0.0',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leave_balances_tenant_id_employee_id_leave_type_id_year` (`tenant_id`,`employee_id`,`leave_type_id`,`year`),
  KEY `leave_balances_tenant_id` (`tenant_id`),
  KEY `leave_balances_employee_id` (`employee_id`),
  KEY `leave_balances_leave_type_id` (`leave_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_balances`
--

LOCK TABLES `leave_balances` WRITE;
/*!40000 ALTER TABLE `leave_balances` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_types` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) DEFAULT NULL,
  `leave_category` enum('Annual','Sick','Emergency','Maternity','Paternity','Unpaid','Compensatory','Bereavement','Study','Other') NOT NULL,
  `is_paid` tinyint(1) DEFAULT '1',
  `max_days_per_year` decimal(5,1) DEFAULT NULL,
  `max_days_per_request` decimal(5,1) DEFAULT NULL,
  `min_days_per_request` decimal(4,1) DEFAULT '0.5',
  `requires_approval` tinyint(1) DEFAULT '1',
  `requires_documents` tinyint(1) DEFAULT '0',
  `allow_negative_balance` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `description` text,
  `color` varchar(7) DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leave_types_tenant_id_code` (`tenant_id`,`code`),
  KEY `leave_types_tenant_id` (`tenant_id`),
  KEY `leave_types_leave_category` (`leave_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES ('57d405bd-093f-4b1f-b677-5667f5465dd8','11111111-1111-1111-1111-111111111111','AL','Annual Leave',NULL,'Annual',1,NULL,NULL,0.5,1,0,0,1,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 14:15:31','2026-07-29 14:15:31',NULL);
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_repayments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loan_repayments` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `loan_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `installment_number` int(11) NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `principal_portion` decimal(12,2) DEFAULT '0.00',
  `interest_portion` decimal(12,2) DEFAULT '0.00',
  `paid_date` date DEFAULT NULL,
  `status` enum('Pending','Paid','Skipped') DEFAULT 'Pending',
  `payroll_run_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_repayments_tenant_id` (`tenant_id`),
  KEY `loan_repayments_loan_id` (`loan_id`),
  KEY `loan_repayments_employee_id` (`employee_id`),
  KEY `loan_repayments_payroll_run_id` (`payroll_run_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_repayments`
--

LOCK TABLES `loan_repayments` WRITE;
/*!40000 ALTER TABLE `loan_repayments` DISABLE KEYS */;
INSERT INTO `loan_repayments` VALUES ('0c7b90ad-e778-46ed-b795-e8addfa4d5a3','11111111-1111-1111-1111-111111111111','780b9805-9891-4688-af44-93e23e2cc3f9','f06c80f6-926c-4c6c-a6d0-1b54814785e3',1,'2026-01-07',20000.00,20000.00,0.00,NULL,'Pending',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-29 23:21:46',NULL),('5cd78ad2-6408-424b-b16e-279d0b39740d','11111111-1111-1111-1111-111111111111','780b9805-9891-4688-af44-93e23e2cc3f9','f06c80f6-926c-4c6c-a6d0-1b54814785e3',5,'2026-05-07',20000.00,20000.00,0.00,NULL,'Pending',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-29 23:21:46',NULL),('9175fc6d-d1e4-4601-9125-c701ca8c293d','11111111-1111-1111-1111-111111111111','780b9805-9891-4688-af44-93e23e2cc3f9','f06c80f6-926c-4c6c-a6d0-1b54814785e3',4,'2026-04-07',20000.00,20000.00,0.00,NULL,'Pending',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-29 23:21:46',NULL),('a0c99df4-2bb7-469d-8a04-b1085c62f39e','11111111-1111-1111-1111-111111111111','780b9805-9891-4688-af44-93e23e2cc3f9','f06c80f6-926c-4c6c-a6d0-1b54814785e3',3,'2026-03-07',20000.00,20000.00,0.00,NULL,'Pending',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-29 23:21:46',NULL),('e508227f-4d04-4a9f-8ff5-4a36d30aea27','11111111-1111-1111-1111-111111111111','780b9805-9891-4688-af44-93e23e2cc3f9','f06c80f6-926c-4c6c-a6d0-1b54814785e3',2,'2026-02-07',20000.00,20000.00,0.00,NULL,'Pending',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:21:46','2026-07-29 23:21:46',NULL);
/*!40000 ALTER TABLE `loan_repayments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_cities`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_cities` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `state_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `country_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name` varchar(150) NOT NULL,
  `name_ar` varchar(150) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `country_id` (`country_id`),
  KEY `master_cities_tenant_id_country_id` (`tenant_id`,`country_id`),
  KEY `master_cities_state_id_name` (`state_id`,`name`),
  CONSTRAINT `master_cities_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `master_states` (`id`),
  CONSTRAINT `master_cities_ibfk_2` FOREIGN KEY (`country_id`) REFERENCES `master_countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_cities`
--

LOCK TABLES `master_cities` WRITE;
/*!40000 ALTER TABLE `master_cities` DISABLE KEYS */;
INSERT INTO `master_cities` VALUES ('cec2ac8f-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489adf8a-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Abu Dhabi City',NULL,1,1,1,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec35a09-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489adf8a-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Al Ain',NULL,1,1,2,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec41b35-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489adf8a-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Madinat Zayed',NULL,1,1,3,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec56d19-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af3ed-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Dubai City',NULL,1,1,4,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec61199-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af3ed-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Jebel Ali',NULL,1,1,5,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec6db30-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af3ed-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Al Barsha',NULL,1,1,6,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec78ec7-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af5a4-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Sharjah City',NULL,1,1,7,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec81fff-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af5a4-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Khor Fakkan',NULL,1,1,8,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec8b23a-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af5a4-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Kalba',NULL,1,1,9,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cec99a33-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af68b-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Ajman City',NULL,1,1,10,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('ceca7a4b-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af68b-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Masfout',NULL,1,1,11,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecb2c1e-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af68b-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Manama',NULL,1,1,12,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecbe782-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af826-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Umm Al Quwain City',NULL,1,1,13,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecc977e-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af826-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Falaj Al Mualla',NULL,1,1,14,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecd2977-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af92c-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Ras Al Khaimah City',NULL,1,1,15,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecdb0a3-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af92c-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Al Rams',NULL,1,1,16,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cece59e8-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489af92c-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Al Jazirah Al Hamra',NULL,1,1,17,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecf29e8-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489afa97-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Fujairah City',NULL,1,1,18,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('cecfd38f-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489afa97-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Dibba Al-Fujairah',NULL,1,1,19,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL),('ced086e5-8b2b-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','489afa97-8b2a-11f1-a77f-00090faa0001','6c6a7f13-8b29-11f1-a77f-00090faa0001','Al Badiyah',NULL,1,1,20,NULL,NULL,'2026-07-29 08:58:43','2026-07-29 08:58:43',NULL);
/*!40000 ALTER TABLE `master_cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_countries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_countries` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(5) NOT NULL COMMENT 'ISO 3166-1 alpha-2',
  `name` varchar(150) NOT NULL,
  `name_ar` varchar(150) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `nationality_ar` varchar(100) DEFAULT NULL,
  `phone_code` varchar(10) DEFAULT NULL,
  `currency_code` varchar(5) DEFAULT NULL,
  `currency_symbol` varchar(5) DEFAULT NULL,
  `flag_emoji` varchar(10) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `master_countries_tenant_id_code` (`tenant_id`,`code`),
  KEY `master_countries_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_countries`
--

LOCK TABLES `master_countries` WRITE;
/*!40000 ALTER TABLE `master_countries` DISABLE KEYS */;
INSERT INTO `master_countries` VALUES ('6c6a7f13-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','AE','United Arab Emirates',NULL,'Emirati',NULL,'+971','AED','Ø¯.Ø¥','??',1,1,1,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6a9d10-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','SA','Saudi Arabia',NULL,'Saudi',NULL,'+966','SAR','ï·¼','??',1,1,2,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6a9e3c-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','QA','Qatar',NULL,'Qatari',NULL,'+974','QAR','Ø±.Ù‚','??',1,1,3,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6a9ee0-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','KW','Kuwait',NULL,'Kuwaiti',NULL,'+965','KWD','Ø¯.Ùƒ','??',1,1,4,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6a9f65-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','BH','Bahrain',NULL,'Bahraini',NULL,'+973','BHD','.Ø¯.Ø¨','??',1,1,5,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6a9fd5-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','OM','Oman',NULL,'Omani',NULL,'+968','OMR','Ø±.Ø¹.','??',1,1,6,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa04c-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','IN','India',NULL,'Indian',NULL,'+91','INR','â‚¹','??',1,1,7,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa0b3-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','PK','Pakistan',NULL,'Pakistani',NULL,'+92','PKR','â‚¨','??',1,1,8,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa153-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','EG','Egypt',NULL,'Egyptian',NULL,'+20','EGP','EÂ£','??',1,1,9,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa1c5-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','JO','Jordan',NULL,'Jordanian',NULL,'+962','JOD','Ø¯.Ø§','??',1,1,10,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa28e-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','LB','Lebanon',NULL,'Lebanese',NULL,'+961','LBP','Ù„.Ù„','??',1,1,11,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa2f2-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','GB','United Kingdom',NULL,'British',NULL,'+44','GBP','Â£','??',1,1,12,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa36e-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','US','United States',NULL,'American',NULL,'+1','USD','$','??',1,1,13,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa3f1-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','PH','Philippines',NULL,'Filipino',NULL,'+63','PHP','â‚±','??',1,1,14,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa45d-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','BD','Bangladesh',NULL,'Bangladeshi',NULL,'+880','BDT','à§³','??',1,1,15,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa4c2-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','LK','Sri Lanka',NULL,'Sri Lankan',NULL,'+94','LKR','à¶»à·”','??',1,1,16,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL),('6c6aa554-8b29-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','NP','Nepal',NULL,'Nepali',NULL,'+977','NPR','à¤°à¥‚','??',1,1,17,NULL,NULL,'2026-07-29 08:41:39','2026-07-29 08:41:39',NULL);
/*!40000 ALTER TABLE `master_countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_data`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_data` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'Entity type: employment_type, leave_type, skill, etc.',
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `name_ar` varchar(200) DEFAULT NULL,
  `description` text,
  `parent_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `metadata` json DEFAULT NULL COMMENT 'Extra type-specific fields',
  `is_system` tinyint(1) DEFAULT '0',
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `master_data_tenant_id_type_code` (`tenant_id`,`type`,`code`),
  KEY `master_data_tenant_id_type_is_active` (`tenant_id`,`type`,`is_active`),
  KEY `master_data_type_name` (`type`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_data`
--

LOCK TABLES `master_data` WRITE;
/*!40000 ALTER TABLE `master_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `master_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_data_audit`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_data_audit` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `record_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `record_type` varchar(50) NOT NULL,
  `user_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `action` enum('create','update','delete','restore','activate','deactivate') NOT NULL,
  `field_name` varchar(100) DEFAULT NULL,
  `old_value` text,
  `new_value` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `master_data_audit_tenant_id_record_type` (`tenant_id`,`record_type`),
  KEY `master_data_audit_record_id` (`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_data_audit`
--

LOCK TABLES `master_data_audit` WRITE;
/*!40000 ALTER TABLE `master_data_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `master_data_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_states`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_states` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `country_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `name_ar` varchar(150) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `master_states_tenant_id_country_id` (`tenant_id`,`country_id`),
  KEY `master_states_country_id_name` (`country_id`,`name`),
  CONSTRAINT `master_states_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `master_countries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_states`
--

LOCK TABLES `master_states` WRITE;
/*!40000 ALTER TABLE `master_states` DISABLE KEYS */;
INSERT INTO `master_states` VALUES ('489adf8a-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','AUH','Abu Dhabi','Ø£Ø¨Ùˆ Ø¸Ø¨ÙŠ',1,1,1,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489af3ed-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','DXB','Dubai','Ø¯Ø¨ÙŠ',1,1,2,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489af5a4-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','SHJ','Sharjah','Ø§Ù„Ø´Ø§Ø±Ù‚Ø©',1,1,3,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489af68b-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','AJM','Ajman','Ø¹Ø¬Ù…Ø§Ù†',1,1,4,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489af826-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','UAQ','Umm Al Quwain','Ø£Ù… Ø§Ù„Ù‚ÙŠÙˆÙŠÙ†',1,1,5,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489af92c-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','RAK','Ras Al Khaimah','Ø±Ø£Ø³ Ø§Ù„Ø®ÙŠÙ…Ø©',1,1,6,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL),('489afa97-8b2a-11f1-a77f-00090faa0001','11111111-1111-1111-1111-111111111111','6c6a7f13-8b29-11f1-a77f-00090faa0001','FUJ','Fujairah','Ø§Ù„ÙØ¬ÙŠØ±Ø©',1,1,7,NULL,NULL,'2026-07-29 08:47:48','2026-07-29 08:47:48',NULL);
/*!40000 ALTER TABLE `master_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offboarding_checklists`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offboarding_checklists` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `task_name` varchar(200) NOT NULL,
  `category` enum('ExitInterview','AssetReturn','ITAccess','FinalSettlement','Documentation','Clearance','Other') DEFAULT 'Other',
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ofc_tenant` (`tenant_id`),
  KEY `offboarding_checklists_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offboarding_checklists`
--

LOCK TABLES `offboarding_checklists` WRITE;
/*!40000 ALTER TABLE `offboarding_checklists` DISABLE KEYS */;
INSERT INTO `offboarding_checklists` VALUES ('af43b392-c530-4f91-8d62-e3a5dd150572','11111111-1111-1111-1111-111111111111','Return Laptop','Other',0,1,'00000000-0000-0000-0000-000000000001','2026-07-29 15:52:14','2026-07-29 15:52:14',NULL);
/*!40000 ALTER TABLE `offboarding_checklists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offboarding_progress`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offboarding_progress` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `checklist_id` char(36) NOT NULL,
  `completed_date` date DEFAULT NULL,
  `completed_by` char(36) DEFAULT NULL,
  `status` enum('Pending','In Progress','Completed','Skipped') DEFAULT 'Pending',
  `notes` text,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ofp_tenant` (`tenant_id`),
  KEY `idx_ofp_employee` (`employee_id`),
  KEY `offboarding_progress_tenant_id` (`tenant_id`),
  KEY `offboarding_progress_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offboarding_progress`
--

LOCK TABLES `offboarding_progress` WRITE;
/*!40000 ALTER TABLE `offboarding_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `offboarding_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offer_letters`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offer_letters` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `offer_number` varchar(30) NOT NULL,
  `applicant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `position_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `offer_date` date NOT NULL,
  `joining_date` date DEFAULT NULL,
  `offered_salary` decimal(12,2) NOT NULL,
  `status` enum('Draft','Sent','Accepted','Declined','Expired') DEFAULT 'Draft',
  `expiry_date` date DEFAULT NULL,
  `terms_and_conditions` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offer_letters_tenant_id` (`tenant_id`),
  KEY `offer_letters_applicant_id` (`applicant_id`),
  KEY `offer_letters_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offer_letters`
--

LOCK TABLES `offer_letters` WRITE;
/*!40000 ALTER TABLE `offer_letters` DISABLE KEYS */;
INSERT INTO `offer_letters` VALUES ('a81aeced-67d2-4b3b-b38e-907df8eb99dd','11111111-1111-1111-1111-111111111111','OL-2026-89789','c024b074-1ceb-450c-8a08-4fcad0e1a82a',NULL,'2026-08-10',NULL,75000.00,'Draft',NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:51:29','2026-07-29 15:51:29',NULL);
/*!40000 ALTER TABLE `offer_letters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onboarding_checklists`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onboarding_checklists` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `task_name` varchar(200) NOT NULL,
  `category` enum('IT','HR','Admin','Training','Documentation','Other') DEFAULT 'HR',
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_onc_tenant` (`tenant_id`),
  KEY `onboarding_checklists_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onboarding_checklists`
--

LOCK TABLES `onboarding_checklists` WRITE;
/*!40000 ALTER TABLE `onboarding_checklists` DISABLE KEYS */;
INSERT INTO `onboarding_checklists` VALUES ('17d7f36e-4c35-47ca-af23-b34d7e9039aa','11111111-1111-1111-1111-111111111111','IT Laptop & Email Setup','IT',1,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 13:28:19','2026-07-30 13:28:19',NULL),('e9a025af-4bbd-4a2a-a053-0593c965222d','11111111-1111-1111-1111-111111111111','Setup Workstation','HR',0,1,'00000000-0000-0000-0000-000000000001','2026-07-29 15:51:50','2026-07-30 13:28:03','2026-07-30 13:28:03');
/*!40000 ALTER TABLE `onboarding_checklists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onboarding_progress`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onboarding_progress` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `checklist_id` char(36) NOT NULL,
  `completed_date` date DEFAULT NULL,
  `completed_by` char(36) DEFAULT NULL,
  `status` enum('Pending','In Progress','Completed','Skipped') DEFAULT 'Pending',
  `notes` text,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_onp_tenant` (`tenant_id`),
  KEY `idx_onp_employee` (`employee_id`),
  KEY `onboarding_progress_tenant_id` (`tenant_id`),
  KEY `onboarding_progress_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onboarding_progress`
--

LOCK TABLES `onboarding_progress` WRITE;
/*!40000 ALTER TABLE `onboarding_progress` DISABLE KEYS */;
INSERT INTO `onboarding_progress` VALUES ('df17662d-23f1-4922-aa54-c7fff81bfab4','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','17d7f36e-4c35-47ca-af23-b34d7e9039aa','2026-07-30',NULL,'Completed',NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 13:30:47','2026-07-30 13:33:02',NULL);
/*!40000 ALTER TABLE `onboarding_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `overtime_entries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `overtime_entries` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `attendance_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `overtime_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_minutes` int(11) DEFAULT '0',
  `overtime_type` enum('Regular','Weekend','Holiday') DEFAULT 'Regular',
  `rate_multiplier` decimal(3,2) DEFAULT '1.25',
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `approved_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reason` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `overtime_entries_tenant_id` (`tenant_id`),
  KEY `overtime_entries_employee_id` (`employee_id`),
  KEY `overtime_entries_overtime_date` (`overtime_date`),
  KEY `overtime_entries_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `overtime_entries`
--

LOCK TABLES `overtime_entries` WRITE;
/*!40000 ALTER TABLE `overtime_entries` DISABLE KEYS */;
INSERT INTO `overtime_entries` VALUES ('af46eb37-f844-4ddb-99d1-774662107a43','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3',NULL,'2026-07-29','18:00:00','19:00:00',60,'Regular',1.25,'Approved','00000000-0000-0000-0000-000000000001','2026-07-29 17:04:05',NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 17:04:02','2026-07-29 17:04:05',NULL);
/*!40000 ALTER TABLE `overtime_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_details`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payroll_details` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `payroll_run_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `basic_salary` decimal(12,2) DEFAULT '0.00',
  `allowances` decimal(12,2) DEFAULT '0.00',
  `deductions` decimal(12,2) DEFAULT '0.00',
  `overtime_pay` decimal(12,2) DEFAULT '0.00',
  `loan_deduction` decimal(12,2) DEFAULT '0.00',
  `gross_pay` decimal(12,2) DEFAULT '0.00',
  `net_pay` decimal(12,2) DEFAULT '0.00',
  `employer_contributions` decimal(12,2) DEFAULT '0.00',
  `working_days` int(11) DEFAULT '0',
  `paid_days` int(11) DEFAULT '0',
  `absent_days` int(11) DEFAULT '0',
  `late_minutes` int(11) DEFAULT '0',
  `overtime_hours` decimal(5,2) DEFAULT '0.00',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_details_tenant_id` (`tenant_id`),
  KEY `payroll_details_payroll_run_id` (`payroll_run_id`),
  KEY `payroll_details_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_details`
--

LOCK TABLES `payroll_details` WRITE;
/*!40000 ALTER TABLE `payroll_details` DISABLE KEYS */;
INSERT INTO `payroll_details` VALUES ('85b7d2cd-bca4-4835-a2bb-f98091ddc089','11111111-1111-1111-1111-111111111111','27bc1f73-18b3-4891-957d-f72587fbdfd1','f06c80f6-926c-4c6c-a6d0-1b54814785e3',5000.00,3000.00,2000.00,0.00,0.00,8000.00,6000.00,0.00,30,30,0,0,0.00,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:48:39','2026-07-30 11:48:39',NULL);
/*!40000 ALTER TABLE `payroll_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_periods`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payroll_periods` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `period_code` varchar(30) NOT NULL,
  `period_name` varchar(150) NOT NULL,
  `frequency` enum('Monthly','Weekly','BiWeekly','Daily') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `payment_date` date DEFAULT NULL,
  `status` enum('Open','Processing','Closed','Locked') DEFAULT 'Open',
  `is_locked` tinyint(1) DEFAULT '0',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payroll_periods_tenant_id_period_code` (`tenant_id`,`period_code`),
  KEY `payroll_periods_tenant_id` (`tenant_id`),
  KEY `payroll_periods_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_periods`
--

LOCK TABLES `payroll_periods` WRITE;
/*!40000 ALTER TABLE `payroll_periods` DISABLE KEYS */;
INSERT INTO `payroll_periods` VALUES ('837788f2-90c3-4fcf-b105-907dd7bdbc55','11111111-1111-1111-1111-111111111111','PP-JUL-2026','July 2026','Monthly','2026-07-01','2026-07-31',NULL,'Processing',0,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 16:15:44','2026-07-30 11:48:39',NULL);
/*!40000 ALTER TABLE `payroll_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_runs`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payroll_runs` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `run_number` varchar(30) NOT NULL,
  `period_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `run_date` date NOT NULL,
  `total_employees` int(11) DEFAULT '0',
  `total_gross` decimal(14,2) DEFAULT '0.00',
  `total_deductions` decimal(14,2) DEFAULT '0.00',
  `total_net_pay` decimal(14,2) DEFAULT '0.00',
  `total_employer_contributions` decimal(14,2) DEFAULT '0.00',
  `status` enum('Draft','Processed','Approved','Reversed') DEFAULT 'Draft',
  `processed_at` datetime DEFAULT NULL,
  `approved_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reversed_at` datetime DEFAULT NULL,
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_runs_tenant_id` (`tenant_id`),
  KEY `payroll_runs_period_id` (`period_id`),
  KEY `payroll_runs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_runs`
--

LOCK TABLES `payroll_runs` WRITE;
/*!40000 ALTER TABLE `payroll_runs` DISABLE KEYS */;
INSERT INTO `payroll_runs` VALUES ('155f07d1-f369-4ab4-8645-f1b5019676f4','11111111-1111-1111-1111-111111111111','PR-000001','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:25:25','2026-07-29 23:40:15','2026-07-29 23:40:15'),('1d4e52eb-abc4-4ec2-86b8-84f0e4a1b62c','11111111-1111-1111-1111-111111111111','PR-000002','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:25:36','2026-07-29 23:40:20','2026-07-29 23:40:20'),('27bc1f73-18b3-4891-957d-f72587fbdfd1','11111111-1111-1111-1111-111111111111','PR-000008','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-30',1,8000.00,2000.00,6000.00,0.00,'Processed','2026-07-30 11:48:39',NULL,NULL,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:48:39','2026-07-30 11:48:39',NULL),('3f8d7b1b-6182-4ca8-9640-0ee9ec143bed','11111111-1111-1111-1111-111111111111','PR-000006','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:41:18','2026-07-29 23:45:28','2026-07-29 23:45:28'),('940087e5-3448-4393-8d9a-4cf2db40cff9','11111111-1111-1111-1111-111111111111','PR-000007','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:44:40','2026-07-29 23:50:58','2026-07-29 23:50:58'),('af8c97d9-2076-4cd0-80e3-f177a325739d','11111111-1111-1111-1111-111111111111','PR-000005','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 23:40:34','2026-07-29 23:41:13','2026-07-29 23:41:13'),('d086b95b-5800-46f7-bb28-e1f9ba604da3','11111111-1111-1111-1111-111111111111','PR-000004','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:25:49','2026-07-29 23:40:28','2026-07-29 23:40:28'),('e5ba70f1-3535-465b-aba3-e1c1e42cc39d','11111111-1111-1111-1111-111111111111','PR-000003','837788f2-90c3-4fcf-b105-907dd7bdbc55','2026-07-29',0,0.00,0.00,0.00,0.00,'Draft',NULL,NULL,NULL,NULL,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:25:40','2026-07-29 23:40:24','2026-07-29 23:40:24');
/*!40000 ALTER TABLE `payroll_runs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payslips`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payslips` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `payslip_number` varchar(30) NOT NULL,
  `payroll_run_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `basic_salary` decimal(12,2) DEFAULT '0.00',
  `allowance_breakdown` json DEFAULT NULL,
  `deduction_breakdown` json DEFAULT NULL,
  `gross_pay` decimal(12,2) DEFAULT '0.00',
  `net_pay` decimal(12,2) DEFAULT '0.00',
  `payment_date` date DEFAULT NULL,
  `status` enum('Draft','Generated','Sent','Acknowledged') DEFAULT 'Generated',
  `generated_at` datetime DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payslips_tenant_id` (`tenant_id`),
  KEY `payslips_payroll_run_id` (`payroll_run_id`),
  KEY `payslips_employee_id` (`employee_id`),
  KEY `payslips_payslip_number` (`payslip_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslips`
--

LOCK TABLES `payslips` WRITE;
/*!40000 ALTER TABLE `payslips` DISABLE KEYS */;
INSERT INTO `payslips` VALUES ('6497de82-c3cb-4d14-bd5a-cedc3257135d','11111111-1111-1111-1111-111111111111','PS-968563','27bc1f73-18b3-4891-957d-f72587fbdfd1','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-01','2026-07-31',5000.00,'[{\"allowances\": 3000}]','[{\"deductions\": 2000}]',8000.00,6000.00,NULL,'Generated','2026-07-30 11:48:39','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 11:48:39','2026-07-30 11:48:39',NULL);
/*!40000 ALTER TABLE `payslips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_appraisals`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `performance_appraisals` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `appraiser_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `appraisal_date` date NOT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `overall_rating` decimal(3,1) DEFAULT NULL,
  `strengths` text,
  `improvements` text,
  `employee_comments` text,
  `appraiser_comments` text,
  `status` enum('Draft','Self Review','Manager Review','Reviewed','Acknowledged') DEFAULT 'Draft',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_appraisals_tenant_id` (`tenant_id`),
  KEY `performance_appraisals_employee_id` (`employee_id`),
  KEY `performance_appraisals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_appraisals`
--

LOCK TABLES `performance_appraisals` WRITE;
/*!40000 ALTER TABLE `performance_appraisals` DISABLE KEYS */;
INSERT INTO `performance_appraisals` VALUES ('255f7022-3e19-4f89-8e46-46bb5658a548','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-29',NULL,NULL,4.5,NULL,NULL,NULL,NULL,'Draft','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:36:41','2026-07-29 15:36:41',NULL),('7a5b178e-5617-4823-b9ae-994c52aa1c52','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','f06c80f6-926c-4c6c-a6d0-1b54814785e3','2026-07-30','2026-07-01','2027-07-31',5.0,NULL,NULL,NULL,NULL,'Draft','610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 14:36:36','2026-07-30 14:36:45',NULL);
/*!40000 ALTER TABLE `performance_appraisals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_goals`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `performance_goals` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `goal_type` enum('Individual','Team','Department','Company') DEFAULT 'Individual',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `start_date` date DEFAULT NULL,
  `target_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `progress_percentage` int(11) DEFAULT '0',
  `weight` decimal(5,2) DEFAULT '100.00' COMMENT 'Weight in appraisal',
  `status` enum('Not Started','In Progress','Completed','On Hold','Cancelled') DEFAULT 'Not Started',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_goals_tenant_id` (`tenant_id`),
  KEY `performance_goals_employee_id` (`employee_id`),
  KEY `performance_goals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_goals`
--

LOCK TABLES `performance_goals` WRITE;
/*!40000 ALTER TABLE `performance_goals` DISABLE KEYS */;
INSERT INTO `performance_goals` VALUES ('89feea73-b93b-4254-8254-e7449accd111','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','One year performance',NULL,'Individual','Medium','2025-01-01','2025-12-31',NULL,9,100.00,'In Progress','00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 15:17:17','2026-07-30 14:38:37',NULL);
/*!40000 ALTER TABLE `performance_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_kpis`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `performance_kpis` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `kpi_type` enum('Quantitative','Qualitative','Behavioral') DEFAULT 'Quantitative',
  `measurement_unit` varchar(50) DEFAULT NULL,
  `target_value` decimal(10,2) DEFAULT NULL,
  `minimum_value` decimal(10,2) DEFAULT NULL,
  `department_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `performance_kpis_tenant_id_code` (`tenant_id`,`code`),
  KEY `performance_kpis_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_kpis`
--

LOCK TABLES `performance_kpis` WRITE;
/*!40000 ALTER TABLE `performance_kpis` DISABLE KEYS */;
INSERT INTO `performance_kpis` VALUES ('3ba77df2-662b-4935-b727-a705cfd127b3','11111111-1111-1111-1111-111111111111','REV-01','Revenue Target',NULL,'Quantitative','USD',500000.00,NULL,NULL,1,'610d0b41-8811-4a49-b42e-90bd14c9f055','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-30 14:35:58','2026-07-30 14:35:58',NULL),('e6c1173a-d101-4bcb-9aa1-242bbbdcfa4d','11111111-1111-1111-1111-111111111111','KPI-001','Productivity Rate',NULL,'Quantitative','Percent',95.00,70.00,NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:35:59','2026-07-29 15:35:59',NULL);
/*!40000 ALTER TABLE `performance_kpis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` char(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(200) NOT NULL,
  `group` varchar(100) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_group` (`group`),
  KEY `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('09a819d4-a34c-44ba-9983-99ec6f7f2a58','employee.export','Export Employees','Employee Management','employees','export',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('09a86034-8f49-48bc-80cb-3bdb992f6225','employee.create','Create Employee','Employee Management','employees','create',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('1f4b640b-7af9-4dc2-a451-d19208600d3a','reports.view','View Reports','Reports','reports','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('256576d5-4534-447b-924e-962b88233f75','leave.view','View Leave','Leave','leave','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('51d526ee-2634-4706-9e0d-d6c10b607f43','payroll.view','View Payroll','Payroll','payroll','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('52c1e361-0ba7-46ec-beb8-806dbd7ca73e','payroll.approve','Approve Payroll','Payroll','payroll','approve',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('68b4b754-3ee6-4220-8a10-21df6fa02196','payroll.generate','Generate Payroll','Payroll','payroll','create',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('6e3d4d3a-4afd-4105-9cd0-3816a2bde42f','settings.edit','Edit Settings','Settings','settings','edit',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('846e8028-73b0-499a-a97e-8cbbb100c48d','reports.export','Export Reports','Reports','reports','export',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('84af0b76-0e00-4452-bdeb-ca6379b92e19','leave.approve','Approve Leave','Leave','leave','approve',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('86634549-e5c8-46c4-89a1-b08f4eee1660','attendance.view','View Attendance','Attendance','attendance','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('8cdb87f8-bc6d-4947-986c-82ead9fcff1e','attendance.approve','Approve Attendance','Attendance','attendance','approve',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('95f64548-b77e-465a-90cb-e4b123074e00','settings.view','View Settings','Settings','settings','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('b1e6596c-a9c8-4041-98c1-823e641da90c','masterdata.manage','Manage Master Data','Master Data','master_data','edit',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('d0d799b2-d07b-41f4-be58-5195b6a966a7','leave.create','Apply Leave','Leave','leave','create',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('dac1867f-0ae5-48b2-8567-5812383261dc','attendance.manage','Manage Attendance','Attendance','attendance','edit',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('ec62bd7a-efb7-4ad9-892b-63fde55b2e0b','security.manage','Manage Security','Security','security','manage',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f1d458c8-49b9-4e66-af7c-6726e8330689','recruitment.view','View Recruitment','Recruitment','recruitment','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f3976f66-9f84-401f-9aad-bcc48069858e','employee.edit','Edit Employee','Employee Management','employees','edit',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f895bd2a-0418-4a0c-9fba-2c28d0a35fd1','recruitment.manage','Manage Recruitment','Recruitment','recruitment','edit',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f9c7192b-1576-45b3-b9f3-a79a31323eda','employee.view','View Employees','Employee Management','employees','view',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f9f7f740-3eb9-4ad2-ba4a-73e351878581','employee.delete','Delete Employee','Employee Management','employees','delete',NULL,1,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_perm` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('071676e5-a65c-46f0-ada6-04e028779172','fdc05935-f00c-4384-bb00-20a5c70eec99','d0d799b2-d07b-41f4-be58-5195b6a966a7','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('0a13ff89-584a-4f6e-b2a7-ad2ae8776588','8a699ad5-e460-4224-baf5-0266d13cd3e7','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('0a4786d4-76a5-4384-84d7-68873c0322c0','02599475-561f-478d-b9e4-a9758065ec33','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('0bc34c59-9120-4025-8cef-1d9cde5b7918','8cbac09b-f282-48a9-86cd-9f0e878e5601','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('0c7a76e3-2b2d-4150-b6ec-4d3b20abcc01','fdc05935-f00c-4384-bb00-20a5c70eec99','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('0e00ff3b-a3f6-47fe-a013-8856dfbb90d4','ab0d5391-7a90-48ae-a413-ba90f58778f4','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('0e5af04f-851f-43dd-85e9-dbdf0863b2e2','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('0f5e191f-f33b-4598-9912-7c18d67a8892','21ee0611-9972-4687-9e67-3302b5ed6098','b1e6596c-a9c8-4041-98c1-823e641da90c','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('10b0f273-d9ae-438d-bf3f-698283044f78','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','f3976f66-9f84-401f-9aad-bcc48069858e','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('13008943-b9cf-466b-a8b3-d12fa3615ff2','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('1697dcae-55c2-4d03-a602-2d5e6600ee5f','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('181bc029-d011-4c54-a49b-116be0c29b2d','ab0d5391-7a90-48ae-a413-ba90f58778f4','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('1c941c23-e39e-4de8-a71d-236c3667f0fe','ab0d5391-7a90-48ae-a413-ba90f58778f4','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('1cc96af0-7b54-4dc9-8cd2-90f8d58f737b','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','84af0b76-0e00-4452-bdeb-ca6379b92e19','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('22b6415f-3028-468e-87f3-ef100a4d1ed4','21a677d4-d87d-4389-a7ff-fb9e36420a20','8cdb87f8-bc6d-4947-986c-82ead9fcff1e','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('22efa586-66d2-4042-8db1-a919840ebbf2','9598e3e7-b3ac-42e3-8af3-96c590b41e8b','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('245422a0-ff05-4bdd-a2a7-c4cc40748382','21a677d4-d87d-4389-a7ff-fb9e36420a20','ec62bd7a-efb7-4ad9-892b-63fde55b2e0b','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('24945ceb-7a86-4360-91f4-7e2743fc1f18','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('26b731e6-ae67-4351-9299-79967ad85d54','a6c498d3-3363-4766-9a6d-d399a2bcee01','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('271eee18-91d4-445a-877b-bfe056df98cc','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('2a7f729c-4e33-42e6-9782-1b92b430d738','21a677d4-d87d-4389-a7ff-fb9e36420a20','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('2cb333af-f9cf-4d51-9204-a94e4717f409','21a677d4-d87d-4389-a7ff-fb9e36420a20','09a819d4-a34c-44ba-9983-99ec6f7f2a58','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('2f38ce73-347d-4503-80da-499e7f8f723a','21a677d4-d87d-4389-a7ff-fb9e36420a20','f3976f66-9f84-401f-9aad-bcc48069858e','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('2f620423-e948-4bda-a22f-cb719ec9e33b','21ee0611-9972-4687-9e67-3302b5ed6098','68b4b754-3ee6-4220-8a10-21df6fa02196','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('31415a47-5df9-4c4d-bc2d-c0b5ab5660fe','21a677d4-d87d-4389-a7ff-fb9e36420a20','d0d799b2-d07b-41f4-be58-5195b6a966a7','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('37b5c4f8-d4e2-4cbc-a5ae-1ee81bb3a13c','ab0d5391-7a90-48ae-a413-ba90f58778f4','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('389ff980-08cf-4e11-9adc-007b73176cda','a6c498d3-3363-4766-9a6d-d399a2bcee01','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('3b9815f4-79cc-4f06-83dd-8035d2267f8b','21ee0611-9972-4687-9e67-3302b5ed6098','8cdb87f8-bc6d-4947-986c-82ead9fcff1e','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('3bcfb1eb-100d-4f00-8eb1-b0feddb36e2e','21ee0611-9972-4687-9e67-3302b5ed6098','6e3d4d3a-4afd-4105-9cd0-3816a2bde42f','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('3c7580ad-783d-443c-b744-41cbda42c416','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','256576d5-4534-447b-924e-962b88233f75','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('3fd82efd-8e79-4ac1-b188-f8b3c021d295','21ee0611-9972-4687-9e67-3302b5ed6098','d0d799b2-d07b-41f4-be58-5195b6a966a7','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('402d136d-3719-488f-b1c7-fca39ccaf61f','21ee0611-9972-4687-9e67-3302b5ed6098','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('4080ef12-8e82-4783-8f8f-f9585e1197b6','21ee0611-9972-4687-9e67-3302b5ed6098','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('4592e3bf-d958-4835-94a7-7daf7b7c1716','02599475-561f-478d-b9e4-a9758065ec33','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('48da745d-f00e-496c-828f-d0f7190c2244','21ee0611-9972-4687-9e67-3302b5ed6098','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('491e9183-648b-4782-9214-710d3a54f72f','21a677d4-d87d-4389-a7ff-fb9e36420a20','84af0b76-0e00-4452-bdeb-ca6379b92e19','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('4df300c0-05c9-4a88-8bad-2ee9bd7a992f','f22efb90-8807-48af-b376-a28388e01ca2','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('4f753706-cd8a-4a5e-a453-066f62d568dc','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('5064ba57-2d95-4c2c-b099-02213f3610dd','21ee0611-9972-4687-9e67-3302b5ed6098','52c1e361-0ba7-46ec-beb8-806dbd7ca73e','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('51c83160-1eb2-4d1d-ba09-8a62b675b7d3','21a677d4-d87d-4389-a7ff-fb9e36420a20','f1d458c8-49b9-4e66-af7c-6726e8330689','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('527ff72f-87a5-42ac-bdd6-21c867efa88c','9598e3e7-b3ac-42e3-8af3-96c590b41e8b','f1d458c8-49b9-4e66-af7c-6726e8330689','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('5331b72e-7692-4b5a-821a-ec6fa9e8ab57','fdc05935-f00c-4384-bb00-20a5c70eec99','256576d5-4534-447b-924e-962b88233f75','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('550fde34-777e-4ca0-b9be-a0a40d32cd46','8a699ad5-e460-4224-baf5-0266d13cd3e7','d0d799b2-d07b-41f4-be58-5195b6a966a7','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('5600a384-2836-4e2e-9706-d66a6e2b7a33','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','09a86034-8f49-48bc-80cb-3bdb992f6225','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('56953be5-fb8b-41d6-9ea9-c5c367291e4a','f22efb90-8807-48af-b376-a28388e01ca2','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('569e71ad-85b5-42d4-baf3-e0e2b5641858','ab0d5391-7a90-48ae-a413-ba90f58778f4','68b4b754-3ee6-4220-8a10-21df6fa02196','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('583ba4e4-30df-42b2-a00c-885c46880cef','21ee0611-9972-4687-9e67-3302b5ed6098','f9f7f740-3eb9-4ad2-ba4a-73e351878581','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('5bf27061-f628-46be-9ddb-a2d6cbdf43ca','21a677d4-d87d-4389-a7ff-fb9e36420a20','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('5e78eb81-3f58-4d5d-90a9-f5b0c56b7054','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('6448cb06-7269-4ea9-b7c4-9cff0502a6cd','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','68b4b754-3ee6-4220-8a10-21df6fa02196','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('66051189-f74c-47c2-9a7e-ec8fcec5779c','9598e3e7-b3ac-42e3-8af3-96c590b41e8b','09a86034-8f49-48bc-80cb-3bdb992f6225','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('6d9b33d2-6a83-4583-91d3-d0d4dd49f1f6','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','f895bd2a-0418-4a0c-9fba-2c28d0a35fd1','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('71cf8d0c-7aa4-482a-a843-af6baf8efe4b','21ee0611-9972-4687-9e67-3302b5ed6098','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('72ee9879-c9ca-4516-91b6-37fafe114a81','8a699ad5-e460-4224-baf5-0266d13cd3e7','f3976f66-9f84-401f-9aad-bcc48069858e','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('7360a4e6-777d-4fb5-adfe-72d0dc2f7a1f','02599475-561f-478d-b9e4-a9758065ec33','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('7394715b-2cca-4841-b710-b6e62027a0bc','8cbac09b-f282-48a9-86cd-9f0e878e5601','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('76f05ad2-77bb-46c1-b53f-cfb149d1f72a','21a677d4-d87d-4389-a7ff-fb9e36420a20','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('78a9a9f9-a5b9-40cc-8940-37f4fd99bcb5','21a677d4-d87d-4389-a7ff-fb9e36420a20','52c1e361-0ba7-46ec-beb8-806dbd7ca73e','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('7a5fd6d2-35c8-46e6-90cb-d8b0fd8a4a3d','21a677d4-d87d-4389-a7ff-fb9e36420a20','f9f7f740-3eb9-4ad2-ba4a-73e351878581','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('7dc81221-e279-4015-bbc4-6b4e6ace7cf7','9598e3e7-b3ac-42e3-8af3-96c590b41e8b','f895bd2a-0418-4a0c-9fba-2c28d0a35fd1','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('807ce8ff-ac65-45a0-9d4e-eae9978c352f','fdc05935-f00c-4384-bb00-20a5c70eec99','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('822a44f1-86ad-4f44-99c2-2006640f8519','21ee0611-9972-4687-9e67-3302b5ed6098','256576d5-4534-447b-924e-962b88233f75','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('8577499f-7e14-426a-8e57-bc662266a616','8cbac09b-f282-48a9-86cd-9f0e878e5601','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('885645b5-c413-4f7e-9690-cd002a0fb214','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('8877abc1-6106-4b05-b704-488bf572e0b0','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','52c1e361-0ba7-46ec-beb8-806dbd7ca73e','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('899421f0-3cd9-4fb0-b8b9-189961a89325','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('8ba9dd22-7961-422e-94f9-3013f8ee97d2','8a699ad5-e460-4224-baf5-0266d13cd3e7','dac1867f-0ae5-48b2-8567-5812383261dc','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('8c71648a-5b76-462a-8e62-512aae8a6ab7','21ee0611-9972-4687-9e67-3302b5ed6098','09a86034-8f49-48bc-80cb-3bdb992f6225','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('90b94ee0-1011-4c82-9c67-58ecc737390a','a6c498d3-3363-4766-9a6d-d399a2bcee01','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('90f408a9-2917-44d1-a637-ca8dd8b167d3','21ee0611-9972-4687-9e67-3302b5ed6098','84af0b76-0e00-4452-bdeb-ca6379b92e19','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('91d562cc-f1aa-4fa1-9a90-2818642d3ddb','a6c498d3-3363-4766-9a6d-d399a2bcee01','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('940298f0-f279-4f7d-9ebc-7534a4d72fdc','21ee0611-9972-4687-9e67-3302b5ed6098','ec62bd7a-efb7-4ad9-892b-63fde55b2e0b','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('955e2bd0-712f-49f0-abc0-115582ac8616','f22efb90-8807-48af-b376-a28388e01ca2','dac1867f-0ae5-48b2-8567-5812383261dc','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('95c75041-404e-4d0c-8f4d-5116f4bb3cb0','21a677d4-d87d-4389-a7ff-fb9e36420a20','b1e6596c-a9c8-4041-98c1-823e641da90c','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('97b4585e-cf6c-4c4d-b5b4-a843cfb4c7f9','8a699ad5-e460-4224-baf5-0266d13cd3e7','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('9dab5651-21f1-49e4-8d90-9b2b917e294f','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('a4b3bd84-e870-4a97-81dd-bd369b16db84','21ee0611-9972-4687-9e67-3302b5ed6098','09a819d4-a34c-44ba-9983-99ec6f7f2a58','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('a6d77d33-b5e7-47e2-b276-72c3db88fe8a','02599475-561f-478d-b9e4-a9758065ec33','84af0b76-0e00-4452-bdeb-ca6379b92e19','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('a7b1289a-9814-4b58-824c-f33f46b5b98a','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('aa13ca3f-a596-4f04-a444-25ddcf77f95e','02599475-561f-478d-b9e4-a9758065ec33','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('ab29cb84-ffc7-414a-8c26-161faedfd522','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','09a819d4-a34c-44ba-9983-99ec6f7f2a58','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('ac900196-b29a-409d-9c53-7c2bc04b6785','8cbac09b-f282-48a9-86cd-9f0e878e5601','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('acddd3ab-bbaf-48c1-9a54-5e17fe1cc543','21a677d4-d87d-4389-a7ff-fb9e36420a20','f895bd2a-0418-4a0c-9fba-2c28d0a35fd1','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('b153ab10-3bbd-4a85-8277-1ea44d175e9e','21a677d4-d87d-4389-a7ff-fb9e36420a20','256576d5-4534-447b-924e-962b88233f75','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('b51d6eba-4dbd-4513-91f9-55518896f87f','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('b5446a27-977e-40c3-ae1e-b43f1671e8c5','ab0d5391-7a90-48ae-a413-ba90f58778f4','52c1e361-0ba7-46ec-beb8-806dbd7ca73e','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('b8344c51-1795-4edb-a2a2-450f4d34c72d','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','dac1867f-0ae5-48b2-8567-5812383261dc','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('b9d5efc1-8599-4612-8bf5-2ccf33e99e5e','21a677d4-d87d-4389-a7ff-fb9e36420a20','68b4b754-3ee6-4220-8a10-21df6fa02196','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('bb7caf84-020d-4937-ad92-ec044bfe6a41','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','95f64548-b77e-465a-90cb-e4b123074e00','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('bc1534f4-ee27-4848-892b-14a4a4400af1','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('bcea3c4b-6a94-4be2-8214-9f6a714e37df','21a677d4-d87d-4389-a7ff-fb9e36420a20','09a86034-8f49-48bc-80cb-3bdb992f6225','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('c5675375-8f08-4980-b3a3-c7bef705edda','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','f1d458c8-49b9-4e66-af7c-6726e8330689','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('d1126473-0273-4370-93fb-198af40a4ae0','21a677d4-d87d-4389-a7ff-fb9e36420a20','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('d2de28d0-c4ea-49d1-8ed3-e7568ca3e2e4','8a699ad5-e460-4224-baf5-0266d13cd3e7','f1d458c8-49b9-4e66-af7c-6726e8330689','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('d300b779-7c3e-4819-97a0-3bcc2c9b9259','21a677d4-d87d-4389-a7ff-fb9e36420a20','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('d51f802a-74c7-40de-a317-cbbd20704988','21ee0611-9972-4687-9e67-3302b5ed6098','dac1867f-0ae5-48b2-8567-5812383261dc','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('d814c16f-8b72-48b7-97fd-52d668b6d13a','21a677d4-d87d-4389-a7ff-fb9e36420a20','6e3d4d3a-4afd-4105-9cd0-3816a2bde42f','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('d860ba2b-1a27-4dc6-9593-1f614c92f55f','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('d88c5607-75f1-4964-8204-a19ae292a66e','8a699ad5-e460-4224-baf5-0266d13cd3e7','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('dc2b5c06-c613-4aca-b5fc-1ce17fc2a9f3','f22efb90-8807-48af-b376-a28388e01ca2','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('dceb9577-d604-48da-bd21-fbf963d14be7','21a677d4-d87d-4389-a7ff-fb9e36420a20','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('ddf4ef45-3fdd-4c6a-a46a-f66f9ac75977','5a7d77f0-17d8-4572-82ca-a4da8c8bf061','846e8028-73b0-499a-a97e-8cbbb100c48d','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('dfb982c2-ce9a-40b5-b037-d825af2fef24','9d4d1939-7698-4659-9ace-bdbc40e6a1c4','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('e2446f5c-71ac-4537-9160-e7dd5ee1b78f','21ee0611-9972-4687-9e67-3302b5ed6098','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('e9d2cdb0-91df-45ef-a914-004fab19189b','21ee0611-9972-4687-9e67-3302b5ed6098','f1d458c8-49b9-4e66-af7c-6726e8330689','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('efb71d54-6893-49ee-9213-944d7b8dc4ef','a6c498d3-3363-4766-9a6d-d399a2bcee01','86634549-e5c8-46c4-89a1-b08f4eee1660','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('f15dd9f3-b7cd-4eac-a0da-25a8c34b77a0','21ee0611-9972-4687-9e67-3302b5ed6098','f895bd2a-0418-4a0c-9fba-2c28d0a35fd1','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f4a142db-9f20-4426-afe4-5abb52195374','21a677d4-d87d-4389-a7ff-fb9e36420a20','dac1867f-0ae5-48b2-8567-5812383261dc','2026-07-29 22:53:13','2026-07-29 22:53:13',NULL),('f6cc37b3-ef0c-4b52-9d5d-80427dd54ced','21ee0611-9972-4687-9e67-3302b5ed6098','51d526ee-2634-4706-9e0d-d6c10b607f43','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('fa87ebce-af95-447b-a289-28579fa1308e','fdc05935-f00c-4384-bb00-20a5c70eec99','1f4b640b-7af9-4dc2-a451-d19208600d3a','2026-07-29 17:07:35','2026-07-29 17:07:35',NULL),('fa935fa6-1176-42b2-9174-204a5f3c48c7','a6c498d3-3363-4766-9a6d-d399a2bcee01','f9c7192b-1576-45b3-b9f3-a79a31323eda','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL),('fc38fc15-d60e-4f2c-aa8a-55f34a148918','cd0169be-ecc0-41de-ad8a-d2b16c58fddb','d0d799b2-d07b-41f4-be58-5195b6a966a7','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('fd8fd3b1-7d50-4890-830b-371dfa16863e','21ee0611-9972-4687-9e67-3302b5ed6098','f3976f66-9f84-401f-9aad-bcc48069858e','2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('ffce282a-37f5-4449-a9fa-7e7017f3ac5a','8a699ad5-e460-4224-baf5-0266d13cd3e7','09a86034-8f49-48bc-80cb-3bdb992f6225','2026-07-29 22:50:29','2026-07-29 22:50:29',NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('02599475-561f-478d-b9e4-a9758065ec33','Department Manager','department_manager',NULL,1,1,100,NULL,NULL,'2026-07-29 22:48:57','2026-07-29 22:48:57',NULL),('21a677d4-d87d-4389-a7ff-fb9e36420a20','Company Admin','company_admin',NULL,1,1,100,NULL,NULL,'2026-07-29 22:48:57','2026-07-29 22:48:57',NULL),('21ee0611-9972-4687-9e67-3302b5ed6098','Super Admin','super_admin','Full system access',1,1,1,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('5a7d77f0-17d8-4572-82ca-a4da8c8bf061','Auditor','auditor',NULL,1,1,100,NULL,NULL,'2026-07-29 22:48:57','2026-07-29 22:48:57',NULL),('8a699ad5-e460-4224-baf5-0266d13cd3e7','HR Officer','hr_officer','Daily HR operations',1,1,4,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('8cbac09b-f282-48a9-86cd-9f0e878e5601','Branch Manager','branch_manager',NULL,1,1,200,NULL,NULL,'2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('9598e3e7-b3ac-42e3-8af3-96c590b41e8b','Recruitment Officer','recruitment_officer',NULL,1,1,100,NULL,NULL,'2026-07-29 22:48:57','2026-07-29 22:48:57',NULL),('9d4d1939-7698-4659-9ace-bdbc40e6a1c4','Finance Manager','finance_manager',NULL,1,1,200,NULL,NULL,'2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('a6c498d3-3363-4766-9a6d-d399a2bcee01','Read Only','read_only','View-only access',1,1,6,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('ab0d5391-7a90-48ae-a413-ba90f58778f4','Payroll Manager','payroll_manager','Payroll and employee data access',1,1,3,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('b45be69a-f04a-4624-b117-77b7a8017e35','Custom','custom',NULL,1,1,200,NULL,NULL,'2026-07-29 22:50:58','2026-07-29 22:50:58',NULL),('cd0169be-ecc0-41de-ad8a-d2b16c58fddb','HR Manager','hr_manager','Full HR access except security',1,1,2,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL),('f22efb90-8807-48af-b376-a28388e01ca2','Attendance Officer','attendance_officer',NULL,1,1,100,NULL,NULL,'2026-07-29 22:48:57','2026-07-29 22:48:57',NULL),('fdc05935-f00c-4384-bb00-20a5c70eec99','Employee','employee','Self-service access',1,1,5,NULL,NULL,'2026-07-29 17:07:34','2026-07-29 17:07:34',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rosters`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rosters` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `shift_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `roster_date` date NOT NULL,
  `is_weekly_off` tinyint(1) DEFAULT '0',
  `is_holiday` tinyint(1) DEFAULT '0',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rosters_tenant_id_employee_id_roster_date` (`tenant_id`,`employee_id`,`roster_date`),
  KEY `rosters_tenant_id` (`tenant_id`),
  KEY `rosters_employee_id` (`employee_id`),
  KEY `rosters_shift_id` (`shift_id`),
  KEY `rosters_roster_date` (`roster_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rosters`
--

LOCK TABLES `rosters` WRITE;
/*!40000 ALTER TABLE `rosters` DISABLE KEYS */;
INSERT INTO `rosters` VALUES ('e190a558-b67d-428c-b98d-cec32293832f','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','cd7d32dd-dce1-40d4-8589-6f8577d554a8','2026-07-01',0,0,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 17:04:18','2026-07-29 17:04:18',NULL);
/*!40000 ALTER TABLE `rosters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_components`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `salary_components` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `structure_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `component_type` enum('Earning','Deduction','EmployerContribution','EmployeeContribution') NOT NULL,
  `calculation_method` enum('Fixed','Percentage','Formula') DEFAULT 'Fixed',
  `value` decimal(12,2) DEFAULT '0.00',
  `percentage_of` varchar(50) DEFAULT NULL COMMENT 'Which base to calculate percentage on (e.g., basic_salary, total_salary)',
  `is_taxable` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salary_components_tenant_id` (`tenant_id`),
  KEY `salary_components_structure_id` (`structure_id`),
  KEY `salary_components_component_type` (`component_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_components`
--

LOCK TABLES `salary_components` WRITE;
/*!40000 ALTER TABLE `salary_components` DISABLE KEYS */;
INSERT INTO `salary_components` VALUES ('2a38b3a6-e844-487f-b62b-ae516008de91','11111111-1111-1111-1111-111111111111','9351dd7b-0b01-4eda-99a1-87f0c78948eb','TEST','Test','Earning','Fixed',500.00,'5',1,1,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 16:29:31','2026-07-29 16:29:31',NULL);
/*!40000 ALTER TABLE `salary_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_structures`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `salary_structures` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `salary_structures_tenant_id_code` (`tenant_id`,`code`),
  KEY `salary_structures_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_structures`
--

LOCK TABLES `salary_structures` WRITE;
/*!40000 ALTER TABLE `salary_structures` DISABLE KEYS */;
INSERT INTO `salary_structures` VALUES ('9351dd7b-0b01-4eda-99a1-87f0c78948eb','11111111-1111-1111-1111-111111111111','GR5','Grade 5',NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 14:15:45','2026-07-29 14:15:45',NULL);
/*!40000 ALTER TABLE `salary_structures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_attendance`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_attendance` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `overtime_enabled` tinyint(1) DEFAULT '1',
  `overtime_daily_limit` int(11) DEFAULT '120',
  `overtime_weekly_limit` int(11) DEFAULT '480',
  `overtime_rate` decimal(4,2) DEFAULT '1.50',
  `overtime_holiday_rate` decimal(4,2) DEFAULT '2.00',
  `auto_deduction_enabled` tinyint(1) DEFAULT '0',
  `late_deduction_type` enum('per_minute','per_hour','fixed') DEFAULT NULL,
  `late_deduction_amount` decimal(10,2) DEFAULT '0.00',
  `biometric_required` tinyint(1) DEFAULT '0',
  `geo_fencing_enabled` tinyint(1) DEFAULT '0',
  `geo_fencing_radius` int(11) DEFAULT '100',
  `ip_restriction_enabled` tinyint(1) DEFAULT '0',
  `allowed_ips` text,
  `half_day_threshold` int(11) DEFAULT '240',
  `absent_threshold` int(11) DEFAULT '480',
  `weekend_overtime_rate` decimal(4,2) DEFAULT '1.50',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_attendance`
--

LOCK TABLES `settings_attendance` WRITE;
/*!40000 ALTER TABLE `settings_attendance` DISABLE KEYS */;
INSERT INTO `settings_attendance` VALUES ('556b64df-089a-4d26-bacb-e61b4b8b26aa','11111111-1111-1111-1111-111111111111',1,120,480,1.50,2.00,1,'per_hour',10.00,0,1,100,0,NULL,240,480,1.50,1,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 13:12:18','2026-07-30 11:45:32');
/*!40000 ALTER TABLE `settings_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_audit_logs`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_audit_logs` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `module` varchar(100) NOT NULL,
  `section` varchar(100) NOT NULL,
  `field_name` varchar(100) DEFAULT NULL,
  `old_value` text,
  `new_value` text,
  `action` enum('create','update','delete') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `settings_audit_logs_tenant_id_module` (`tenant_id`,`module`),
  KEY `settings_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_audit_logs`
--

LOCK TABLES `settings_audit_logs` WRITE;
/*!40000 ALTER TABLE `settings_audit_logs` DISABLE KEYS */;
INSERT INTO `settings_audit_logs` VALUES ('3cf62b85-0313-418d-b690-ecacd7a2231b','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','CompanyProfile',NULL,NULL,'{\"profileType\":\"business_unit\",\"name\":\"Test\",\"code\":\"T001\",\"address\":\"\",\"phone\":\"\",\"email\":\"\"}','create','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 12:25:39'),('4002752f-5817-4e4d-9a26-5d4dd91b44ab','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','Localization',NULL,'{\"id\":\"2a3b9090-bef0-4567-883a-25c5e8bba27a\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"language\":\"en\",\"languagesSupported\":null,\"currency\":\"AED\",\"currencySymbol\":\"Ø¯.Ø¥\",\"dateFormat\":\"DD/MM/YYYY\",\"numberFormat\":\"#,###.##\",\"timezone\":\"Asia/Dubai\",\"country\":\"AE\",\"regionalHolidaysEnabled\":true,\"countrySpecificRules\":null,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:25:42.000Z\",\"updatedAt\":\"2026-07-29T08:25:42.000Z\"}','{\"id\":\"2a3b9090-bef0-4567-883a-25c5e8bba27a\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"language\":\"en\",\"languagesSupported\":null,\"currency\":\"AED\",\"currencySymbol\":\"Ø¯.Ø¥\",\"dateFormat\":\"DD/MM/YYYY\",\"numberFormat\":\"#,###.##\",\"timezone\":\"Asia/Dubai\",\"country\":\"AE\",\"regionalHolidaysEnabled\":true,\"countrySpecificRules\":null,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:25:42.000Z\",\"updatedAt\":\"2026-07-29T08:25:42.000Z\"}','update','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 12:25:51'),('4021d30d-c1a6-4836-8b55-f65ab82b92c6','11111111-1111-1111-1111-111111111111','610d0b41-8811-4a49-b42e-90bd14c9f055','system','Settings','CompanyProfile',NULL,'{\"id\":\"ec2bc9e5-6d13-46c1-9521-df1eb0b00bbf\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"profileType\":\"business_unit\",\"name\":\"Test\",\"code\":\"T001\",\"parentId\":null,\"address\":\"\",\"phone\":\"\",\"email\":\"\",\"managerId\":null,\"isActive\":true,\"sortOrder\":0,\"metadata\":null,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:25:39.000Z\",\"updatedAt\":\"2026-07-29T08:25:39.000Z\"}',NULL,'delete','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-30 11:44:22'),('47cab4f9-a9e9-4e0c-bbeb-3da3f33e0e5d','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','Payroll',NULL,'{\"id\":\"6f6b46e3-1e2b-43f7-a12b-6f41c09d8bd3\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"payrollFrequency\":null,\"payDay\":28,\"salaryCutoffDay\":25,\"wpsEnabled\":true,\"wpsAgentCode\":null,\"basicSalaryPercentage\":\"60.00\",\"housingAllowancePercentage\":\"20.00\",\"transportAllowancePercentage\":\"10.00\",\"otherAllowancePercentage\":\"10.00\",\"overtimeCalculation\":null,\"deductionCalculation\":null,\"taxEnabled\":false,\"socialSecurityEnabled\":false,\"socialSecurityRate\":\"0.00\",\"gratuityEnabled\":true,\"gratuityCalculation\":null,\"payslipLanguage\":\"en\",\"payslipFormat\":\"pdf\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:36.000Z\",\"updatedAt\":\"2026-07-29T09:11:36.000Z\"}','{\"id\":\"6f6b46e3-1e2b-43f7-a12b-6f41c09d8bd3\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"payrollFrequency\":\"monthly\",\"payDay\":28,\"salaryCutoffDay\":25,\"wpsEnabled\":true,\"wpsAgentCode\":null,\"basicSalaryPercentage\":\"60.00\",\"housingAllowancePercentage\":\"20.00\",\"transportAllowancePercentage\":\"10.00\",\"otherAllowancePercentage\":\"10.00\",\"overtimeCalculation\":null,\"deductionCalculation\":null,\"taxEnabled\":false,\"socialSecurityEnabled\":false,\"socialSecurityRate\":\"0.00\",\"gratuityEnabled\":true,\"gratuityCalculation\":null,\"payslipLanguage\":\"en\",\"payslipFormat\":\"pdf\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:36.000Z\",\"updatedAt\":\"2026-07-29T09:11:36.000Z\"}','update','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 14:53:14'),('4942688f-67ef-44bf-856d-7bed0a210c07','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','General',NULL,'{\"id\":\"cba4de82-7c4c-49e5-b37b-353ae87a9a20\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"companyName\":null,\"logoUrl\":null,\"addressLine1\":null,\"addressLine2\":null,\"city\":null,\"state\":null,\"country\":null,\"postalCode\":null,\"phone\":null,\"email\":null,\"website\":null,\"taxNumber\":null,\"defaultCurrency\":\"AED\",\"timezone\":\"Asia/Dubai\",\"language\":\"en\",\"dateFormat\":\"DD/MM/YYYY\",\"timeFormat\":\"12h\",\"financialYearStart\":\"01-01\",\"payrollStartMonth\":1,\"companyWorkingDays\":\"Mon,Tue,Wed,Thu,Fri\",\"weekStartDay\":\"Monday\",\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:16:53.000Z\",\"updatedAt\":\"2026-07-29T08:16:53.000Z\"}','{\"id\":\"cba4de82-7c4c-49e5-b37b-353ae87a9a20\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"companyName\":\"Test Computers LLC\",\"logoUrl\":null,\"addressLine1\":\"Dubai\",\"addressLine2\":null,\"city\":null,\"state\":null,\"country\":null,\"postalCode\":\"00000\",\"phone\":\"+971 56 539 7934\",\"email\":\"test@gmail.com\",\"website\":\"ezeeflo.com\",\"taxNumber\":\"09288384\",\"defaultCurrency\":\"AED\",\"timezone\":\"Asia/Dubai\",\"language\":\"en\",\"dateFormat\":\"DD/MM/YYYY\",\"timeFormat\":\"12h\",\"financialYearStart\":\"01-01\",\"payrollStartMonth\":1,\"companyWorkingDays\":\"Mon,Tue,Wed,Thu,Fri\",\"weekStartDay\":\"Monday\",\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:16:53.000Z\",\"updatedAt\":\"2026-07-29T08:16:53.000Z\"}','update','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 12:25:12'),('583817bc-4d6f-4f0f-97f5-8e774f6f2eeb','11111111-1111-1111-1111-111111111111','610d0b41-8811-4a49-b42e-90bd14c9f055','system','Settings','Attendance',NULL,'{\"id\":\"556b64df-089a-4d26-bacb-e61b4b8b26aa\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"overtimeEnabled\":true,\"overtimeDailyLimit\":120,\"overtimeWeeklyLimit\":480,\"overtimeRate\":\"1.50\",\"overtimeHolidayRate\":\"2.00\",\"autoDeductionEnabled\":false,\"lateDeductionType\":null,\"lateDeductionAmount\":\"0.00\",\"biometricRequired\":false,\"geoFencingEnabled\":false,\"geoFencingRadius\":100,\"ipRestrictionEnabled\":false,\"allowedIps\":null,\"halfDayThreshold\":240,\"absentThreshold\":480,\"weekendOvertimeRate\":\"1.50\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:12:18.000Z\",\"updatedAt\":\"2026-07-29T09:12:18.000Z\"}','{\"id\":\"556b64df-089a-4d26-bacb-e61b4b8b26aa\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"overtimeEnabled\":true,\"overtimeDailyLimit\":120,\"overtimeWeeklyLimit\":480,\"overtimeRate\":\"1.50\",\"overtimeHolidayRate\":\"2.00\",\"autoDeductionEnabled\":true,\"lateDeductionType\":\"per_hour\",\"lateDeductionAmount\":10,\"biometricRequired\":false,\"geoFencingEnabled\":true,\"geoFencingRadius\":100,\"ipRestrictionEnabled\":false,\"allowedIps\":null,\"halfDayThreshold\":240,\"absentThreshold\":480,\"weekendOvertimeRate\":\"1.50\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:12:18.000Z\",\"updatedAt\":\"2026-07-29T09:12:18.000Z\"}','update','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-30 11:45:32'),('717841ba-a81b-433f-b985-812328faf439','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','Security',NULL,'{\"id\":\"cef82382-f712-41de-a16e-6b155f854588\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"passwordMinLength\":8,\"passwordComplexity\":null,\"passwordExpiryDays\":90,\"sessionTimeoutMinutes\":30,\"maxLoginAttempts\":5,\"lockoutDurationMinutes\":15,\"mfaEnabled\":false,\"mfaType\":null,\"ipWhitelistingEnabled\":false,\"allowedIps\":null,\"auditLogRetentionDays\":90,\"dataEncryptionEnabled\":true,\"forcePasswordReset\":false,\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:52.000Z\",\"updatedAt\":\"2026-07-29T09:11:52.000Z\"}','{\"id\":\"cef82382-f712-41de-a16e-6b155f854588\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"passwordMinLength\":8,\"passwordComplexity\":\"medium\",\"passwordExpiryDays\":90,\"sessionTimeoutMinutes\":30,\"maxLoginAttempts\":5,\"lockoutDurationMinutes\":15,\"mfaEnabled\":false,\"mfaType\":null,\"ipWhitelistingEnabled\":false,\"allowedIps\":null,\"auditLogRetentionDays\":90,\"dataEncryptionEnabled\":true,\"forcePasswordReset\":false,\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:52.000Z\",\"updatedAt\":\"2026-07-29T09:11:52.000Z\"}','update','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 17:02:19'),('7792a91f-b6d1-43ec-9771-e0611390a3d8','11111111-1111-1111-1111-111111111111','610d0b41-8811-4a49-b42e-90bd14c9f055','system','Settings','Payroll',NULL,'{\"id\":\"6f6b46e3-1e2b-43f7-a12b-6f41c09d8bd3\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"payrollFrequency\":\"monthly\",\"payDay\":28,\"salaryCutoffDay\":25,\"wpsEnabled\":true,\"wpsAgentCode\":null,\"basicSalaryPercentage\":\"60.00\",\"housingAllowancePercentage\":\"20.00\",\"transportAllowancePercentage\":\"10.00\",\"otherAllowancePercentage\":\"10.00\",\"overtimeCalculation\":null,\"deductionCalculation\":null,\"taxEnabled\":false,\"socialSecurityEnabled\":false,\"socialSecurityRate\":\"0.00\",\"gratuityEnabled\":true,\"gratuityCalculation\":null,\"payslipLanguage\":\"en\",\"payslipFormat\":\"pdf\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":\"00000000-0000-0000-0000-000000000001\",\"createdAt\":\"2026-07-29T09:11:36.000Z\",\"updatedAt\":\"2026-07-29T10:53:14.000Z\"}','{\"id\":\"6f6b46e3-1e2b-43f7-a12b-6f41c09d8bd3\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"payrollFrequency\":\"monthly\",\"payDay\":28,\"salaryCutoffDay\":25,\"wpsEnabled\":true,\"wpsAgentCode\":null,\"basicSalaryPercentage\":\"60.00\",\"housingAllowancePercentage\":\"20.00\",\"transportAllowancePercentage\":\"10.00\",\"otherAllowancePercentage\":\"10.00\",\"overtimeCalculation\":\"basic_only\",\"deductionCalculation\":\"basic\",\"taxEnabled\":false,\"socialSecurityEnabled\":false,\"socialSecurityRate\":\"0.00\",\"gratuityEnabled\":true,\"gratuityCalculation\":\"basic_salary\",\"payslipLanguage\":\"en\",\"payslipFormat\":\"pdf\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":\"00000000-0000-0000-0000-000000000001\",\"createdAt\":\"2026-07-29T09:11:36.000Z\",\"updatedAt\":\"2026-07-29T10:53:14.000Z\"}','update','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-30 11:47:28'),('7820bd50-c960-4a03-ba64-5ad9b3ca7267','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000001','system','Settings','WorkingHours',NULL,'{\"id\":\"9c4b9f8a-b3d1-4938-9d6b-bcb73e0217af\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"workingDays\":\"Mon,Tue,Wed,Thu,Fri\",\"weekendDays\":\"Sat,Sun\",\"workStartTime\":\"09:00:00\",\"workEndTime\":\"18:00:00\",\"breakStartTime\":null,\"breakDurationMinutes\":0,\"lunchStartTime\":null,\"lunchDurationMinutes\":60,\"gracePeriodMinutes\":15,\"lateArrivalPolicy\":\"warning\",\"lateDeductionType\":null,\"earlyDeparturePolicy\":\"warning\",\"flexibleHoursEnabled\":false,\"flexibleStartTime\":null,\"flexibleEndTime\":null,\"nightShiftStart\":null,\"nightShiftEnd\":null,\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:25:52.000Z\",\"updatedAt\":\"2026-07-29T08:25:52.000Z\"}','{\"id\":\"9c4b9f8a-b3d1-4938-9d6b-bcb73e0217af\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"workingDays\":\"Mon,Tue,Wed,Thu,Fri\",\"weekendDays\":\"Sat,Sun\",\"workStartTime\":\"09:00:00\",\"workEndTime\":\"18:00:00\",\"breakStartTime\":null,\"breakDurationMinutes\":0,\"lunchStartTime\":\"13:00\",\"lunchDurationMinutes\":60,\"gracePeriodMinutes\":15,\"lateArrivalPolicy\":\"warning\",\"lateDeductionType\":\"per_hour\",\"earlyDeparturePolicy\":\"warning\",\"flexibleHoursEnabled\":true,\"flexibleStartTime\":\"09:00\",\"flexibleEndTime\":\"10:00\",\"nightShiftStart\":\"18:00\",\"nightShiftEnd\":\"19:00\",\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T08:25:52.000Z\",\"updatedAt\":\"2026-07-29T08:25:52.000Z\"}','update','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 12:26:59'),('aceece63-ea71-436c-a851-81a5beb34de6','11111111-1111-1111-1111-111111111111','610d0b41-8811-4a49-b42e-90bd14c9f055','system','Settings','Leave',NULL,'{\"id\":\"99ece0cc-4d6c-4cb7-9889-d1b886aca333\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"leaveYearStart\":\"01-01\",\"accrualMethod\":null,\"accrualRate\":\"2.50\",\"carryForwardEnabled\":true,\"carryForwardMax\":30,\"carryForwardExpiry\":\"03-31\",\"negativeBalanceAllowed\":false,\"negativeBalanceMax\":0,\"approvalWorkflow\":null,\"autoApproveEnabled\":false,\"minNoticeDays\":0,\"maxConsecutiveDays\":0,\"weekendIncluded\":false,\"holidayIncluded\":false,\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:37.000Z\",\"updatedAt\":\"2026-07-29T09:11:37.000Z\"}','{\"id\":\"99ece0cc-4d6c-4cb7-9889-d1b886aca333\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\",\"leaveYearStart\":\"01-01\",\"accrualMethod\":\"monthly\",\"accrualRate\":\"2.50\",\"carryForwardEnabled\":true,\"carryForwardMax\":30,\"carryForwardExpiry\":\"03-31\",\"negativeBalanceAllowed\":true,\"negativeBalanceMax\":2,\"approvalWorkflow\":\"direct_manager\",\"autoApproveEnabled\":false,\"minNoticeDays\":3,\"maxConsecutiveDays\":10,\"weekendIncluded\":false,\"holidayIncluded\":false,\"isActive\":true,\"createdBy\":\"00000000-0000-0000-0000-000000000001\",\"updatedBy\":null,\"createdAt\":\"2026-07-29T09:11:37.000Z\",\"updatedAt\":\"2026-07-29T09:11:37.000Z\"}','update','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-30 11:46:44');
/*!40000 ALTER TABLE `settings_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_company_profile`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_company_profile` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `profile_type` enum('branch','business_unit','location','cost_center') NOT NULL,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `parent_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `address` text,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `manager_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int(11) DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `settings_company_profile_tenant_id_profile_type` (`tenant_id`,`profile_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_company_profile`
--

LOCK TABLES `settings_company_profile` WRITE;
/*!40000 ALTER TABLE `settings_company_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings_company_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_email`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_email` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int(11) DEFAULT '587',
  `smtp_username` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(500) DEFAULT NULL,
  `smtp_encryption` enum('none','ssl','tls') DEFAULT 'tls',
  `from_name` varchar(150) DEFAULT NULL,
  `from_email` varchar(150) DEFAULT NULL,
  `reply_to` varchar(150) DEFAULT NULL,
  `email_footer` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_email`
--

LOCK TABLES `settings_email` WRITE;
/*!40000 ALTER TABLE `settings_email` DISABLE KEYS */;
INSERT INTO `settings_email` VALUES ('d2605ced-480c-4b8c-935f-2e746f6449c2','11111111-1111-1111-1111-111111111111',NULL,587,NULL,NULL,'tls',NULL,NULL,NULL,NULL,1,'00000000-0000-0000-0000-000000000001',NULL,'2026-07-29 13:11:57','2026-07-29 13:11:57');
/*!40000 ALTER TABLE `settings_email` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_general`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_general` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `tax_number` varchar(50) DEFAULT NULL,
  `default_currency` varchar(5) DEFAULT 'AED',
  `timezone` varchar(50) DEFAULT 'Asia/Dubai',
  `language` varchar(10) DEFAULT 'en',
  `date_format` varchar(20) DEFAULT 'DD/MM/YYYY',
  `time_format` varchar(10) DEFAULT '12h',
  `financial_year_start` varchar(5) DEFAULT '01-01',
  `payroll_start_month` int(11) DEFAULT '1',
  `company_working_days` varchar(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  `week_start_day` varchar(10) DEFAULT 'Monday',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_general_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_general`
--

LOCK TABLES `settings_general` WRITE;
/*!40000 ALTER TABLE `settings_general` DISABLE KEYS */;
INSERT INTO `settings_general` VALUES ('cba4de82-7c4c-49e5-b37b-353ae87a9a20','11111111-1111-1111-1111-111111111111','Test Computers LLC',NULL,'Dubai',NULL,NULL,NULL,NULL,'00000','+971 56 539 7934','test@gmail.com','ezeeflo.com','09288384','AED','Asia/Dubai','en','DD/MM/YYYY','12h','01-01',1,'Mon,Tue,Wed,Thu,Fri','Monday','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 12:16:53','2026-07-29 12:25:12');
/*!40000 ALTER TABLE `settings_general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_leave`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_leave` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `leave_year_start` varchar(5) DEFAULT '01-01',
  `accrual_method` enum('monthly','quarterly','annual','custom') DEFAULT NULL,
  `accrual_rate` decimal(5,2) DEFAULT '2.50',
  `carry_forward_enabled` tinyint(1) DEFAULT '1',
  `carry_forward_max` int(11) DEFAULT '30',
  `carry_forward_expiry` varchar(5) DEFAULT '03-31',
  `negative_balance_allowed` tinyint(1) DEFAULT '0',
  `negative_balance_max` int(11) DEFAULT '0',
  `approval_workflow` enum('direct_manager','multi_level','hr_only') DEFAULT NULL,
  `auto_approve_enabled` tinyint(1) DEFAULT '0',
  `min_notice_days` int(11) DEFAULT '0',
  `max_consecutive_days` int(11) DEFAULT '0',
  `weekend_included` tinyint(1) DEFAULT '0',
  `holiday_included` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_leave`
--

LOCK TABLES `settings_leave` WRITE;
/*!40000 ALTER TABLE `settings_leave` DISABLE KEYS */;
INSERT INTO `settings_leave` VALUES ('99ece0cc-4d6c-4cb7-9889-d1b886aca333','11111111-1111-1111-1111-111111111111','01-01','monthly',2.50,1,30,'03-31',1,2,'direct_manager',0,3,10,0,0,1,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 13:11:37','2026-07-30 11:46:44');
/*!40000 ALTER TABLE `settings_leave` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_localization`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_localization` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `language` varchar(10) DEFAULT 'en',
  `languages_supported` json DEFAULT NULL COMMENT '["en","ar"]',
  `currency` varchar(5) DEFAULT 'AED',
  `currency_symbol` varchar(5) DEFAULT 'Ø¯.Ø¥',
  `date_format` varchar(20) DEFAULT 'DD/MM/YYYY',
  `number_format` varchar(20) DEFAULT '#,###.##',
  `timezone` varchar(50) DEFAULT 'Asia/Dubai',
  `country` varchar(2) DEFAULT 'AE' COMMENT 'ISO 3166-1 alpha-2',
  `regional_holidays_enabled` tinyint(1) DEFAULT '1',
  `country_specific_rules` json DEFAULT NULL,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_localization_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_localization`
--

LOCK TABLES `settings_localization` WRITE;
/*!40000 ALTER TABLE `settings_localization` DISABLE KEYS */;
INSERT INTO `settings_localization` VALUES ('2a3b9090-bef0-4567-883a-25c5e8bba27a','11111111-1111-1111-1111-111111111111','en',NULL,'AED','Ø¯.Ø¥','DD/MM/YYYY','#,###.##','Asia/Dubai','AE',1,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 12:25:42','2026-07-29 12:25:51');
/*!40000 ALTER TABLE `settings_localization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_notifications`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_notifications` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  `sms_notifications` tinyint(1) DEFAULT '0',
  `push_notifications` tinyint(1) DEFAULT '1',
  `leave_alert` tinyint(1) DEFAULT '1',
  `attendance_alert` tinyint(1) DEFAULT '1',
  `payroll_alert` tinyint(1) DEFAULT '1',
  `document_expiry_alert` tinyint(1) DEFAULT '1',
  `birthday_alert` tinyint(1) DEFAULT '1',
  `onboarding_alert` tinyint(1) DEFAULT '1',
  `alert_days_before` int(11) DEFAULT '7',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_notifications`
--

LOCK TABLES `settings_notifications` WRITE;
/*!40000 ALTER TABLE `settings_notifications` DISABLE KEYS */;
INSERT INTO `settings_notifications` VALUES ('f46d78a6-9035-4008-a60d-6de53f0d064e','11111111-1111-1111-1111-111111111111',1,0,1,1,1,1,1,1,1,7,1,'00000000-0000-0000-0000-000000000001',NULL,'2026-07-29 13:11:55','2026-07-29 13:11:55');
/*!40000 ALTER TABLE `settings_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_payroll`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_payroll` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `payroll_frequency` enum('monthly','bi-weekly','weekly') DEFAULT NULL,
  `pay_day` int(11) DEFAULT '28',
  `salary_cutoff_day` int(11) DEFAULT '25',
  `wps_enabled` tinyint(1) DEFAULT '1',
  `wps_agent_code` varchar(50) DEFAULT NULL,
  `basic_salary_percentage` decimal(5,2) DEFAULT '60.00',
  `housing_allowance_percentage` decimal(5,2) DEFAULT '20.00',
  `transport_allowance_percentage` decimal(5,2) DEFAULT '10.00',
  `other_allowance_percentage` decimal(5,2) DEFAULT '10.00',
  `overtime_calculation` enum('basic_only','gross_salary') DEFAULT NULL,
  `deduction_calculation` enum('gross','basic') DEFAULT NULL,
  `tax_enabled` tinyint(1) DEFAULT '0',
  `social_security_enabled` tinyint(1) DEFAULT '0',
  `social_security_rate` decimal(5,2) DEFAULT '0.00',
  `gratuity_enabled` tinyint(1) DEFAULT '1',
  `gratuity_calculation` enum('basic_salary','gross_salary') DEFAULT NULL,
  `payslip_language` varchar(10) DEFAULT 'en',
  `payslip_format` varchar(20) DEFAULT 'pdf',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_payroll`
--

LOCK TABLES `settings_payroll` WRITE;
/*!40000 ALTER TABLE `settings_payroll` DISABLE KEYS */;
INSERT INTO `settings_payroll` VALUES ('6f6b46e3-1e2b-43f7-a12b-6f41c09d8bd3','11111111-1111-1111-1111-111111111111','monthly',28,25,1,NULL,60.00,20.00,10.00,10.00,'basic_only','basic',0,0,0.00,1,'basic_salary','en','pdf',1,'00000000-0000-0000-0000-000000000001','610d0b41-8811-4a49-b42e-90bd14c9f055','2026-07-29 13:11:36','2026-07-30 11:47:28');
/*!40000 ALTER TABLE `settings_payroll` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_security`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_security` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `password_min_length` int(11) DEFAULT '8',
  `password_complexity` enum('low','medium','high') DEFAULT NULL,
  `password_expiry_days` int(11) DEFAULT '90',
  `session_timeout_minutes` int(11) DEFAULT '30',
  `max_login_attempts` int(11) DEFAULT '5',
  `lockout_duration_minutes` int(11) DEFAULT '15',
  `mfa_enabled` tinyint(1) DEFAULT '0',
  `mfa_type` enum('sms','email','authenticator') DEFAULT NULL,
  `ip_whitelisting_enabled` tinyint(1) DEFAULT '0',
  `allowed_ips` text,
  `audit_log_retention_days` int(11) DEFAULT '90',
  `data_encryption_enabled` tinyint(1) DEFAULT '1',
  `force_password_reset` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_security`
--

LOCK TABLES `settings_security` WRITE;
/*!40000 ALTER TABLE `settings_security` DISABLE KEYS */;
INSERT INTO `settings_security` VALUES ('cef82382-f712-41de-a16e-6b155f854588','11111111-1111-1111-1111-111111111111',8,'medium',90,30,5,15,0,NULL,0,NULL,90,1,0,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 13:11:52','2026-07-29 17:02:19');
/*!40000 ALTER TABLE `settings_security` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_sms`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_sms` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `provider` enum('twilio','nexmo','infobip','custom') DEFAULT NULL,
  `api_key` varchar(500) DEFAULT NULL,
  `api_secret` varchar(500) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `api_url` varchar(500) DEFAULT NULL,
  `daily_limit` int(11) DEFAULT '1000',
  `balance_alert_threshold` int(11) DEFAULT '100',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_sms`
--

LOCK TABLES `settings_sms` WRITE;
/*!40000 ALTER TABLE `settings_sms` DISABLE KEYS */;
INSERT INTO `settings_sms` VALUES ('02cc0e8e-812f-4446-8443-f33bca29b441','11111111-1111-1111-1111-111111111111',NULL,NULL,NULL,NULL,NULL,1000,100,1,'00000000-0000-0000-0000-000000000001',NULL,'2026-07-29 13:12:00','2026-07-29 13:12:00');
/*!40000 ALTER TABLE `settings_sms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings_working_hours`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings_working_hours` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `working_days` varchar(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  `weekend_days` varchar(30) DEFAULT 'Sat,Sun',
  `work_start_time` time DEFAULT '09:00:00',
  `work_end_time` time DEFAULT '18:00:00',
  `break_start_time` time DEFAULT NULL,
  `break_duration_minutes` int(11) DEFAULT '0',
  `lunch_start_time` time DEFAULT NULL,
  `lunch_duration_minutes` int(11) DEFAULT '60',
  `grace_period_minutes` int(11) DEFAULT '15',
  `late_arrival_policy` enum('deduct_leave','deduct_salary','warning','flexible') DEFAULT 'warning',
  `late_deduction_type` enum('per_minute','per_hour','half_day','full_day') DEFAULT NULL,
  `early_departure_policy` enum('deduct_leave','deduct_salary','warning','flexible') DEFAULT 'warning',
  `flexible_hours_enabled` tinyint(1) DEFAULT '0',
  `flexible_start_time` time DEFAULT NULL,
  `flexible_end_time` time DEFAULT NULL,
  `night_shift_start` time DEFAULT NULL,
  `night_shift_end` time DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_working_hours_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings_working_hours`
--

LOCK TABLES `settings_working_hours` WRITE;
/*!40000 ALTER TABLE `settings_working_hours` DISABLE KEYS */;
INSERT INTO `settings_working_hours` VALUES ('9c4b9f8a-b3d1-4938-9d6b-bcb73e0217af','11111111-1111-1111-1111-111111111111','Mon,Tue,Wed,Thu,Fri','Sat,Sun','09:00:00','18:00:00',NULL,0,'13:00:00',60,15,'warning','per_hour','warning',1,'09:00:00','10:00:00','18:00:00','19:00:00',1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 12:25:52','2026-07-29 12:26:59');
/*!40000 ALTER TABLE `settings_working_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_assignments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shift_assignments` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `shift_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `assigned_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shift_assignments_tenant_id` (`tenant_id`),
  KEY `shift_assignments_employee_id` (`employee_id`),
  KEY `shift_assignments_shift_id` (`shift_id`),
  KEY `shift_assignments_effective_from_effective_to` (`effective_from`,`effective_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_assignments`
--

LOCK TABLES `shift_assignments` WRITE;
/*!40000 ALTER TABLE `shift_assignments` DISABLE KEYS */;
INSERT INTO `shift_assignments` VALUES ('b81c4c6f-acda-4273-bff8-a01954ab0a7f','11111111-1111-1111-1111-111111111111','f06c80f6-926c-4c6c-a6d0-1b54814785e3','cd7d32dd-dce1-40d4-8589-6f8577d554a8','00000000-0000-0000-0000-000000000001','2026-07-01','2026-07-31',1,NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 17:04:34','2026-07-29 17:04:34',NULL);
/*!40000 ALTER TABLE `shift_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shifts` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `shift_type` enum('Morning','Evening','Night','Rotational','Flexible') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `grace_period_minutes` int(11) DEFAULT '15',
  `late_threshold_minutes` int(11) DEFAULT '30',
  `half_day_threshold_minutes` int(11) DEFAULT '240',
  `early_leaving_threshold_minutes` int(11) DEFAULT '15',
  `break_start_time` time DEFAULT NULL,
  `break_end_time` time DEFAULT NULL,
  `total_working_hours` decimal(4,2) DEFAULT NULL,
  `weekly_off_days` varchar(50) DEFAULT NULL COMMENT 'Comma-separated day numbers: 0=Sun,1=Mon,...,6=Sat',
  `is_night_shift` tinyint(1) DEFAULT '0',
  `color` varchar(7) DEFAULT NULL COMMENT 'Hex color for UI display',
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shifts_tenant_id_code` (`tenant_id`,`code`),
  KEY `shifts_tenant_id` (`tenant_id`),
  KEY `shifts_shift_type` (`shift_type`),
  KEY `shifts_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES ('cd7d32dd-dce1-40d4-8589-6f8577d554a8','11111111-1111-1111-1111-111111111111','MORN','Morning Shift','Morning','08:00:00','17:00:00',15,30,240,15,NULL,NULL,NULL,NULL,0,NULL,NULL,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 14:15:19','2026-07-29 14:15:19',NULL);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_attendees`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `training_attendees` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `session_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `employee_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `attendance_status` enum('Enrolled','Attended','Absent','Completed') DEFAULT 'Enrolled',
  `score` decimal(5,2) DEFAULT NULL,
  `certificate_issued` tinyint(1) DEFAULT '0',
  `feedback` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `training_attendees_tenant_id` (`tenant_id`),
  KEY `training_attendees_session_id` (`session_id`),
  KEY `training_attendees_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_attendees`
--

LOCK TABLES `training_attendees` WRITE;
/*!40000 ALTER TABLE `training_attendees` DISABLE KEYS */;
INSERT INTO `training_attendees` VALUES ('e105acc3-6635-4ffd-9076-0d4559445c2b','11111111-1111-1111-1111-111111111111','538fcae2-64dc-4043-b6ab-5360b2e86e19','f06c80f6-926c-4c6c-a6d0-1b54814785e3','Enrolled',NULL,0,NULL,'00000000-0000-0000-0000-000000000001','2026-07-29 15:40:36','2026-07-29 15:40:36',NULL);
/*!40000 ALTER TABLE `training_attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_courses`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `training_courses` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `category` enum('Technical','Soft Skills','Compliance','Leadership','Safety','Other') DEFAULT 'Other',
  `duration_hours` int(11) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT '0.00',
  `provider_name` varchar(200) DEFAULT NULL,
  `is_internal` tinyint(1) DEFAULT '1',
  `is_mandatory` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `training_courses_tenant_id_code` (`tenant_id`,`code`),
  KEY `training_courses_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_courses`
--

LOCK TABLES `training_courses` WRITE;
/*!40000 ALTER TABLE `training_courses` DISABLE KEYS */;
INSERT INTO `training_courses` VALUES ('10bce743-a51a-47c0-b0ab-63b79f01d533','11111111-1111-1111-1111-111111111111','TR-001','Safety Training',NULL,'Other',8,0.00,NULL,1,0,1,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:37:18','2026-07-29 15:37:18',NULL);
/*!40000 ALTER TABLE `training_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_sessions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `training_sessions` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `session_name` varchar(200) NOT NULL,
  `trainer_name` varchar(200) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `max_attendees` int(11) DEFAULT NULL,
  `enrolled_count` int(11) DEFAULT '0',
  `status` enum('Planned','In Progress','Completed','Cancelled') DEFAULT 'Planned',
  `notes` text,
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `training_sessions_tenant_id` (`tenant_id`),
  KEY `training_sessions_course_id` (`course_id`),
  KEY `training_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_sessions`
--

LOCK TABLES `training_sessions` WRITE;
/*!40000 ALTER TABLE `training_sessions` DISABLE KEYS */;
INSERT INTO `training_sessions` VALUES ('538fcae2-64dc-4043-b6ab-5360b2e86e19','11111111-1111-1111-1111-111111111111','10bce743-a51a-47c0-b0ab-63b79f01d533','Safety Session Q3',NULL,NULL,'2026-08-01',NULL,NULL,NULL,NULL,0,'Planned',NULL,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-29 15:37:53','2026-07-29 15:37:53',NULL);
/*!40000 ALTER TABLE `training_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_companies`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_companies` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_company` (`user_id`,`company_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `user_companies_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_companies`
--

LOCK TABLES `user_companies` WRITE;
/*!40000 ALTER TABLE `user_companies` DISABLE KEYS */;
INSERT INTO `user_companies` VALUES ('','9071ed0e-b63b-45f8-9fc6-2a1be15351f4','11111111-1111-1111-1111-111111111111',1,'2026-07-29 22:20:30','2026-07-29 22:20:30',NULL),('3feaf3f5-8b7f-11f1-a77f-00090faa0001','610d0b41-8811-4a49-b42e-90bd14c9f055','11111111-1111-1111-1111-111111111111',1,'2026-07-29 22:55:56','2026-07-29 22:55:56',NULL);
/*!40000 ALTER TABLE `user_companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES ('352b679c-02c5-47d6-9c7f-78fb74c28186','37a40e2e-d21b-4d59-98bc-e76ed60da514','21ee0611-9972-4687-9e67-3302b5ed6098',1,'2026-07-29 17:07:35','2026-07-29 17:07:35',NULL);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `role` enum('super_admin','company_admin','hr_manager','payroll_manager','hr_officer','recruitment_officer','attendance_officer','department_manager','branch_manager','finance_manager','employee','read_only','auditor','custom') DEFAULT 'employee',
  `is_active` tinyint(1) DEFAULT '1',
  `is_locked` tinyint(1) DEFAULT '0',
  `locked_at` datetime DEFAULT NULL,
  `login_attempts` int(11) DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT '0',
  `mfa_enabled` tinyint(1) DEFAULT '0',
  `mfa_secret` varchar(255) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('37a40e2e-d21b-4d59-98bc-e76ed60da514','admin','admin@ezeeflo.com','$2a$12$swxfbhnFqpkS0LRP0wNYNuQ3SVKbOs9QgA1ulgWWTH7wbGmxn5P0.','Super','Admin',NULL,NULL,'super_admin',1,0,NULL,0,NULL,NULL,NULL,0,0,NULL,NULL,NULL,'2026-07-29 17:03:45','2026-07-29 22:18:03',NULL),('610d0b41-8811-4a49-b42e-90bd14c9f055','yasir@me-mits.com','yasir@me-mits.com','$2a$12$FZkX8D//ujctt9R77G0MeuLdivcuExo6gDBjXPFtBgsa7m2iWVINe','Yasir','Majeed','22345664',NULL,'company_admin',1,0,NULL,0,'2026-07-31 19:14:47','::1',NULL,0,0,NULL,'9071ed0e-b63b-45f8-9fc6-2a1be15351f4','9071ed0e-b63b-45f8-9fc6-2a1be15351f4','2026-07-29 22:36:29','2026-07-31 19:14:47',NULL),('9071ed0e-b63b-45f8-9fc6-2a1be15351f4','superadmin','admin@erp.com','$2a$12$abQEji3UhPkh9Z4XTmy66eHgDxrOQqsZUDtXpbkJPBjmK8UiWV5gS','Super','Admin',NULL,NULL,'super_admin',1,0,NULL,0,'2026-07-30 00:04:57','::1',NULL,0,0,NULL,NULL,NULL,'2026-07-29 22:10:07','2026-07-30 00:04:57',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wps_configurations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wps_configurations` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `config_name` varchar(100) NOT NULL,
  `bank_code` varchar(50) DEFAULT NULL,
  `agent_code` varchar(50) DEFAULT NULL,
  `file_format` enum('SIF','CSV','EXCEL') DEFAULT 'SIF',
  `employer_reference` varchar(100) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `updated_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wps_configurations_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wps_configurations`
--

LOCK TABLES `wps_configurations` WRITE;
/*!40000 ALTER TABLE `wps_configurations` DISABLE KEYS */;
/*!40000 ALTER TABLE `wps_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wps_exports`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wps_exports` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `export_number` varchar(30) NOT NULL,
  `config_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `payroll_run_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `export_date` date NOT NULL,
  `total_employees` int(11) DEFAULT '0',
  `total_amount` decimal(14,2) DEFAULT '0.00',
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `status` enum('Draft','Generated','Submitted') DEFAULT 'Draft',
  `created_by` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wps_exports_tenant_id` (`tenant_id`),
  KEY `wps_exports_payroll_run_id` (`payroll_run_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wps_exports`
--

LOCK TABLES `wps_exports` WRITE;
/*!40000 ALTER TABLE `wps_exports` DISABLE KEYS */;
/*!40000 ALTER TABLE `wps_exports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'ezeeflo_hr_payroll'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_attendance_report`(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE, IN p_employee_id CHAR(36))
BEGIN
  SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
         a.attendance_date, a.check_in_time, a.check_out_time,
         a.status, a.late_minutes, a.total_worked_minutes, a.overtime_minutes,
         a.check_in_method, a.is_manual_entry, a.remarks
  FROM attendances a
  JOIN employees e ON e.id = a.employee_id AND e.deleted_at IS NULL
  WHERE a.tenant_id = p_tenant_id AND a.deleted_at IS NULL
    AND (p_date_from IS NULL OR a.attendance_date >= p_date_from)
    AND (p_date_to IS NULL OR a.attendance_date <= p_date_to)
    AND (p_employee_id IS NULL OR p_employee_id = '' OR a.employee_id = p_employee_id)
  ORDER BY a.attendance_date DESC, e.employee_code;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_department_summary`(IN p_tenant_id CHAR(36))
BEGIN SELECT d.name AS department, d.code AS department_code, COUNT(e.id) AS total_employees, SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) AS active_employees, SUM(CASE WHEN e.gender = 'Male' THEN 1 ELSE 0 END) AS male_count, SUM(CASE WHEN e.gender = 'Female' THEN 1 ELSE 0 END) AS female_count, AVG(e.basic_salary) AS avg_basic_salary, SUM(e.total_salary) AS total_salary_cost FROM departments d LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL WHERE d.tenant_id = p_tenant_id AND d.deleted_at IS NULL GROUP BY d.id, d.name, d.code ORDER BY total_employees DESC; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_employee_report`(IN p_tenant_id CHAR(36), IN p_status VARCHAR(50), IN p_department_id CHAR(36))
BEGIN SELECT e.employee_code, e.first_name, e.last_name, e.gender, e.nationality, e.work_email, e.mobile_number, e.joining_date, e.contract_end_date, d.name AS department, des.name AS designation, b.name AS branch, e.basic_salary, e.total_salary, e.status FROM employees e LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL LEFT JOIN designations des ON des.id = e.designation_id AND des.deleted_at IS NULL LEFT JOIN branches b ON b.id = e.branch_id AND b.deleted_at IS NULL WHERE e.tenant_id = p_tenant_id AND e.deleted_at IS NULL AND (p_status IS NULL OR p_status = '' OR e.status = p_status) AND (p_department_id IS NULL OR p_department_id = '' OR e.department_id = p_department_id) ORDER BY e.employee_code; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_eosb_report`(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE)
BEGIN
  SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
         ec.calculation_date, ec.joining_date, ec.last_working_date,
         ec.years_of_service, ec.basic_salary, ec.termination_type,
         ec.first_5_years_amount, ec.after_5_years_amount, ec.total_eosb_amount,
         ec.max_cap_amount, ec.notes
  FROM eosb_calculations ec
  JOIN employees e ON e.id = ec.employee_id AND e.deleted_at IS NULL
  WHERE ec.tenant_id = p_tenant_id AND ec.deleted_at IS NULL
    AND (p_date_from IS NULL OR ec.calculation_date >= p_date_from)
    AND (p_date_to IS NULL OR ec.calculation_date <= p_date_to)
  ORDER BY ec.calculation_date DESC, e.employee_code;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_headcount_report`(IN p_tenant_id CHAR(36), IN p_as_of_date DATE)
BEGIN SELECT SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) AS active_count, SUM(CASE WHEN e.status = 'Inactive' THEN 1 ELSE 0 END) AS inactive_count, SUM(CASE WHEN e.status = 'On Leave' THEN 1 ELSE 0 END) AS on_leave_count, SUM(CASE WHEN e.status IN ('Terminated', 'Resigned', 'Retired') THEN 1 ELSE 0 END) AS separated_count, COUNT(e.id) AS total_headcount, AVG(e.total_salary) AS avg_salary, SUM(e.total_salary) AS total_salary_budget FROM employees e WHERE e.tenant_id = p_tenant_id AND e.deleted_at IS NULL AND (p_as_of_date IS NULL OR e.joining_date <= p_as_of_date); END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_leave_balance_report`(IN p_tenant_id CHAR(36), IN p_year INT, IN p_employee_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, d.name AS department, lt.code AS leave_code, lt.name AS leave_type, lt.leave_category, lb.opening_balance, lb.accrued_days, lb.used_days, lb.pending_days, lb.available_balance, lb.carry_forward_days FROM leave_balances lb JOIN employees e ON e.id = lb.employee_id AND e.deleted_at IS NULL JOIN leave_types lt ON lt.id = lb.leave_type_id AND lt.deleted_at IS NULL LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL WHERE lb.tenant_id = p_tenant_id AND lb.deleted_at IS NULL AND lb.year = p_year AND (p_employee_id IS NULL OR p_employee_id = '' OR lb.employee_id = p_employee_id) ORDER BY e.employee_code, lt.leave_category; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loan_report`(IN p_tenant_id CHAR(36), IN p_status VARCHAR(50))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, el.loan_number, el.loan_type, el.principal_amount, el.monthly_installment, el.total_installments, el.paid_installments, el.remaining_amount, el.start_date, el.end_date, el.status FROM employee_loans el JOIN employees e ON e.id = el.employee_id AND e.deleted_at IS NULL WHERE el.tenant_id = p_tenant_id AND el.deleted_at IS NULL AND (p_status IS NULL OR p_status = '' OR el.status = p_status) ORDER BY el.created_at DESC; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_overtime_report`(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE, IN p_employee_id CHAR(36))
BEGIN
  SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
         d.name AS department,
         oe.overtime_date, oe.start_time, oe.end_time, oe.total_minutes,
         oe.overtime_type, oe.rate_multiplier, oe.status, oe.reason
  FROM overtime_entries oe
  JOIN employees e ON e.id = oe.employee_id AND e.deleted_at IS NULL
  LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL
  WHERE oe.tenant_id = p_tenant_id AND oe.deleted_at IS NULL
    AND (p_date_from IS NULL OR oe.overtime_date >= p_date_from)
    AND (p_date_to IS NULL OR oe.overtime_date <= p_date_to)
    AND (p_employee_id IS NULL OR p_employee_id = '' OR oe.employee_id = p_employee_id)
  ORDER BY oe.overtime_date DESC, e.employee_code;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_payroll_register`(IN p_tenant_id CHAR(36), IN p_payroll_run_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, d.name AS department, des.name AS designation, pd.basic_salary, pd.allowances, pd.deductions, pd.overtime_pay, pd.loan_deduction, pd.gross_pay, pd.net_pay, pd.employer_contributions, pd.working_days, pd.paid_days, pd.absent_days FROM payroll_details pd JOIN employees e ON e.id = pd.employee_id AND e.deleted_at IS NULL LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL LEFT JOIN designations des ON des.id = e.designation_id AND des.deleted_at IS NULL WHERE pd.tenant_id = p_tenant_id AND pd.deleted_at IS NULL AND pd.payroll_run_id = p_payroll_run_id ORDER BY e.employee_code; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_performance_report`(IN p_tenant_id CHAR(36), IN p_employee_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, pa.appraisal_date, pa.period_from, pa.period_to, pa.overall_rating, pa.strengths, pa.improvements, pa.status, CONCAT(apr.first_name, ' ', apr.last_name) AS appraiser_name FROM performance_appraisals pa JOIN employees e ON e.id = pa.employee_id AND e.deleted_at IS NULL LEFT JOIN employees apr ON apr.id = pa.appraiser_id AND apr.deleted_at IS NULL WHERE pa.tenant_id = p_tenant_id AND pa.deleted_at IS NULL AND (p_employee_id IS NULL OR p_employee_id = '' OR pa.employee_id = p_employee_id) ORDER BY pa.appraisal_date DESC; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_training_report`(IN p_tenant_id CHAR(36), IN p_course_id CHAR(36))
BEGIN SELECT tc.code AS course_code, tc.name AS course_name, tc.category, ts.session_name, ts.start_date, ts.end_date, ts.trainer_name, ts.status AS session_status, COUNT(ta.id) AS total_enrolled, SUM(CASE WHEN ta.attendance_status = 'Attended' THEN 1 ELSE 0 END) AS attended_count, SUM(CASE WHEN ta.attendance_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count, AVG(ta.score) AS avg_score FROM training_courses tc JOIN training_sessions ts ON ts.course_id = tc.id AND ts.deleted_at IS NULL LEFT JOIN training_attendees ta ON ta.session_id = ts.id AND ta.deleted_at IS NULL WHERE tc.tenant_id = p_tenant_id AND tc.deleted_at IS NULL AND (p_course_id IS NULL OR p_course_id = '' OR tc.id = p_course_id) GROUP BY tc.id, tc.code, tc.name, tc.category, ts.id, ts.session_name, ts.start_date, ts.end_date, ts.trainer_name, ts.status ORDER BY ts.start_date DESC; END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-31 20:35:41

