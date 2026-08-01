-- ============================================================================
-- EzeeFlo HR & Payroll Database Schema
-- Database: ezeeflo_hr_payroll
-- Phase 1: Core Tables (Organization + Employee)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS ezeeflo_hr_payroll
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ezeeflo_hr_payroll;

-- ============================================================================
-- BRANCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS branches (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  is_head_office TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE INDEX idx_branch_tenant_code (tenant_id, code),
  INDEX idx_branch_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NULL,
  parent_id CHAR(36) NULL,
  branch_id CHAR(36) NULL,
  manager_id CHAR(36) NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE INDEX idx_dept_tenant_code (tenant_id, code),
  INDEX idx_dept_tenant (tenant_id),
  INDEX idx_dept_branch (branch_id),
  INDEX idx_dept_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DESIGNATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS designations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NULL,
  department_id CHAR(36) NULL,
  grade VARCHAR(20) NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE INDEX idx_desig_tenant_code (tenant_id, code),
  INDEX idx_desig_tenant (tenant_id),
  INDEX idx_desig_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COST CENTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_centers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NULL,
  department_id CHAR(36) NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE INDEX idx_cc_tenant_code (tenant_id, code),
  INDEX idx_cc_tenant (tenant_id),
  INDEX idx_cc_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  employee_code VARCHAR(30) NOT NULL,

  -- Personal
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name_ar VARCHAR(300) NULL,
  gender ENUM('Male', 'Female', 'Other') NULL,
  date_of_birth DATE NULL,
  place_of_birth VARCHAR(150) NULL,
  nationality VARCHAR(100) NULL,
  religion VARCHAR(50) NULL,
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed') NULL,
  blood_group VARCHAR(5) NULL,

  -- Contact
  personal_email VARCHAR(150) NULL,
  work_email VARCHAR(150) NULL,
  mobile_number VARCHAR(30) NULL,
  work_phone VARCHAR(30) NULL,
  emergency_contact_name VARCHAR(150) NULL,
  emergency_contact_number VARCHAR(30) NULL,
  emergency_contact_relation VARCHAR(50) NULL,

  -- Address
  address_line1 VARCHAR(255) NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,

  -- Passport
  passport_number VARCHAR(50) NULL,
  passport_issue_date DATE NULL,
  passport_expiry_date DATE NULL,
  passport_issue_country VARCHAR(100) NULL,

  -- Visa
  visa_number VARCHAR(50) NULL,
  visa_type VARCHAR(50) NULL,
  visa_issue_date DATE NULL,
  visa_expiry_date DATE NULL,
  visa_issue_place VARCHAR(100) NULL,

  -- Emirates ID
  emirates_id VARCHAR(50) NULL,
  emirates_id_expiry_date DATE NULL,

  -- Labor Card
  labor_card_number VARCHAR(50) NULL,
  labor_card_expiry_date DATE NULL,

  -- Employment
  joining_date DATE NULL,
  confirmation_date DATE NULL,
  contract_start_date DATE NULL,
  contract_end_date DATE NULL,
  contract_type ENUM('Limited', 'Unlimited', 'Part-Time', 'Contractor', 'Intern', 'Probation') NULL,
  employment_type ENUM('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Intern', 'Consultant') NULL,
  probation_end_date DATE NULL,
  resignation_date DATE NULL,
  last_working_date DATE NULL,
  termination_date DATE NULL,
  termination_reason TEXT NULL,

  -- Organization
  department_id CHAR(36) NULL,
  designation_id CHAR(36) NULL,
  branch_id CHAR(36) NULL,
  cost_center_id CHAR(36) NULL,
  reporting_manager_id CHAR(36) NULL,

  -- Salary
  basic_salary DECIMAL(12, 2) DEFAULT 0,
  housing_allowance DECIMAL(12, 2) DEFAULT 0,
  transport_allowance DECIMAL(12, 2) DEFAULT 0,
  other_allowances DECIMAL(12, 2) DEFAULT 0,
  total_salary DECIMAL(12, 2) DEFAULT 0,
  salary_currency VARCHAR(3) DEFAULT 'AED',
  bank_name VARCHAR(150) NULL,
  bank_account_number VARCHAR(50) NULL,
  iban VARCHAR(50) NULL,
  swift_code VARCHAR(20) NULL,
  wps_agent_code VARCHAR(50) NULL,

  -- Status
  status ENUM('Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired') DEFAULT 'Active',

  -- Other
  photo VARCHAR(255) NULL,
  notes TEXT NULL,

  -- Audit
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,

  UNIQUE INDEX idx_emp_tenant_code (tenant_id, employee_code),
  INDEX idx_emp_tenant (tenant_id),
  INDEX idx_emp_dept (department_id),
  INDEX idx_emp_desig (designation_id),
  INDEX idx_emp_branch (branch_id),
  INDEX idx_emp_cost_center (cost_center_id),
  INDEX idx_emp_manager (reporting_manager_id),
  INDEX idx_emp_status (status),
  INDEX idx_emp_joining (joining_date),
  INDEX idx_emp_contract_end (contract_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EMPLOYEE DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  document_type ENUM('Contract', 'Passport', 'Visa', 'EmiratesID', 'LaborCard', 'Certificate', 'OfferLetter', 'Warning', 'Other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  issue_date DATE NULL,
  expiry_date DATE NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,

  INDEX idx_doc_tenant (tenant_id),
  INDEX idx_doc_employee (employee_id),
  INDEX idx_doc_type (document_type),
  INDEX idx_doc_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
