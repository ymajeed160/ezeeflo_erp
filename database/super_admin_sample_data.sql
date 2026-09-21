-- ═══════════════════════════════════════════════════════════════
-- EzeeFlo Super Admin Portal — Sample Data INSERT Script
-- Database: ezeeflo_hr_payroll
-- Date: 2026-08-01
-- Note: Run after creating tables with super_admin_prod_script.sql
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════
-- 1. SUPER ADMIN ACCOUNT
-- Password: Admin@123  (bcrypt hashed)
-- ═══════════════════════
INSERT INTO `super_admins` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `is_active`, `is_locked`, `login_attempts`, `must_change_password`, `created_at`, `updated_at`)
VALUES ('7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', 'superadmin', 'admin@ezeeflo.com', '$2a$12$zzwII8DlL49xs8sSiwrzvOY3qXgKlEoBEcAtHBsvPwtWaecDNPDM.', 'Super', 'Admin', '+971500000000', 1, 0, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- ═══════════════════════
-- 2. SUBSCRIPTION PLANS
-- ═══════════════════════
INSERT INTO `subscription_plans` (`id`, `name`, `code`, `price`, `billing_cycle`, `max_employees`, `max_users`, `max_branches`, `max_departments`, `max_payroll_runs`, `storage_limit_mb`, `max_api_requests`, `grace_period_days`, `enabled_modules`, `is_active`, `sort_order`, `created_by`, `created_at`, `updated_at`)
VALUES
('a3415396-b4eb-4b6c-9142-fb8b2acf2f58', 'Starter', 'starter', 0, 'annually', 25, 5, 3, 5, 12, 512, 5000, 7,
 '["employees","attendance","leave","payroll","settings","master_data","security"]', 1, 1,
 '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW()),

('2c15dcdf-05f6-4dfa-8a42-300eadfe8a14', 'Professional', 'professional', 99, 'annually', 100, 20, 10, 20, 24, 2048, 20000, 15,
 '["employees","attendance","leave","payroll","recruitment","training","reports","settings","master_data","security","benefits"]', 1, 2,
 '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW()),

('2c9fcae5-6734-424c-9b56-166311b8080a', 'Enterprise', 'enterprise', 299, 'annually', 500, 100, 50, 100, 52, 10240, 100000, 30,
 '["employees","attendance","leave","payroll","recruitment","training","performance","documents","reports","settings","master_data","security","ess","benefits"]', 1, 3,
 '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW()),

('bf47b275-1d0a-4189-8940-fb0ad1c3d4e6', 'Custom', 'custom', 0, 'annually', 50, 10, 5, 10, 12, 1024, 10000, 15,
 '["employees","attendance","leave","payroll","recruitment","training","performance","documents","reports","settings","master_data","security","ess","benefits"]', 1, 99,
 '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ═══════════════════════
-- 3. SAMPLE COMPANY
-- ═══════════════════════
INSERT INTO `super_admin_companies` 
(`id`, `name`, `legal_name`, `trade_license_number`, `tax_registration_number`, `country`, `city`, `address`, `phone`, `email`, `website`, `logo_url`, `timezone`, `currency`, `language`, `working_days`, `financial_year_start`, `status`, `subscription_plan`, `subscription_start_date`, `subscription_expiry_date`, `max_employees`, `max_users`, `max_branches`, `max_departments`, `max_payroll_runs`, `storage_limit_mb`, `max_api_requests`, `grace_period_days`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`)
VALUES ('05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'Test Company LLC', 'Test Company Legal', '', '', 'UAE', 'Dubai', '', '', 'test@testcompany.com', '', '', 'Asia/Dubai', 'AED', 'en', 'Mon,Tue,Wed,Thu,Fri', '01-01', 'active', 'starter', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 50, 10, 5, 10, 12, 1024, 10000, 15, '', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW());

-- ═══════════════════════
-- 4. SAMPLE COMPANY ADMIN
-- ═══════════════════════
INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `role`, `is_active`, `must_change_password`, `created_by`, `created_at`, `updated_at`)
VALUES ('d95e2ac4-26d5-47f3-a033-8799f18247eb', 'johndoe', 'john@testcompany.com', '$2a$12$LJ3m4ys3Lk0TSwHCpNqrBeX8KQ9JF5.BC1ShvWDZVnPZSzV1vqiTe', 'John', 'Doe', '+971501234567', 'company_admin', 1, 1, '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', NOW(), NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Link admin to company
INSERT INTO `user_companies` (`id`, `user_id`, `company_id`, `is_default`, `created_at`, `updated_at`)
VALUES (UUID(), 'd95e2ac4-26d5-47f3-a033-8799f18247eb', '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 1, NOW(), NOW());

-- ═══════════════════════
-- 5. SAMPLE DEPARTMENTS
-- ═══════════════════════
INSERT INTO `departments` (`id`, `name`, `code`, `description`, `is_active`, `tenant_id`, `created_by`, `created_at`, `updated_at`) VALUES
('f211b46f-eb23-4074-ad99-d4eb6e9c01b0', 'Administration', 'ADMIN', 'Administration Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('6c009bd6-ac71-4422-bb96-1c8317581525', 'Human Resources', 'HR', 'Human Resources Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('e62f7192-a473-4db3-83ad-373a26fbb9bf', 'Finance', 'FIN', 'Finance Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('7bdf56dc-461d-4f80-9a1f-4873dbf64220', 'Information Technology', 'IT', 'IT Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('286e915f-f712-44e5-a395-d2795c79ee30', 'Sales & Marketing', 'SALES', 'Sales & Marketing Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('8519068e-7894-4018-8a6d-96072f0acc19', 'Operations', 'OPS', 'Operations Department', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW());

-- ═══════════════════════
-- 6. SAMPLE BRANCH
-- ═══════════════════════
INSERT INTO `branches` (`id`, `name`, `code`, `address`, `city`, `country`, `is_active`, `is_default`, `tenant_id`, `created_by`, `created_at`, `updated_at`)
VALUES ('07329a63-2d39-45ee-ade1-0dbb62aced19', 'Head Office', 'HO', 'Main Office', 'Dubai', 'UAE', 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW());

-- ═══════════════════════
-- 7. SAMPLE DESIGNATIONS
-- ═══════════════════════
INSERT INTO `designations` (`id`, `name`, `code`, `is_active`, `tenant_id`, `created_by`, `created_at`, `updated_at`) VALUES
('aa204110-4372-4a92-b054-8831ac891571', 'CEO', 'CEO', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('2969276d-b6a6-469e-bc65-2758a5d89f03', 'Manager', 'MGR', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('dd325204-06c0-401b-93b0-5552481cfeca', 'Supervisor', 'SUP', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('9ac4efa2-7792-4061-88cb-500159078859', 'Officer', 'OFF', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('61a3898b-4737-4896-b24d-2a2b32f520dd', 'Assistant', 'AST', 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW());

-- ═══════════════════════
-- 8. SAMPLE LEAVE TYPES
-- ═══════════════════════
INSERT INTO `leave_types` (`id`, `name`, `code`, `leave_category`, `max_days_per_year`, `is_paid`, `requires_approval`, `is_active`, `tenant_id`, `created_by`, `created_at`, `updated_at`) VALUES
('b901852f-7bd6-45da-8a3a-d6d2561c629b', 'Annual Leave', 'ANNUAL', 'Annual', 30, 1, 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('241b8b5b-e1eb-45c1-b971-da6502ca441c', 'Sick Leave', 'SICK', 'Sick', 15, 1, 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('3967e26f-f5a1-4122-8773-9a9ebcf41c8b', 'Emergency Leave', 'EMERGENCY', 'Emergency', 5, 1, 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('56934f7e-3c05-47da-9694-268437105ccf', 'Maternity Leave', 'MATERNITY', 'Maternity', 60, 1, 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW()),
('604a9e13-6cc4-4bfc-bf28-23de6b437883', 'Unpaid Leave', 'UNPAID', 'Unpaid', 30, 0, 1, 1, '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'd95e2ac4-26d5-47f3-a033-8799f18247eb', NOW(), NOW());

-- ═══════════════════════
-- 9. SAMPLE AUDIT LOGS
-- ═══════════════════════
INSERT INTO `super_admin_audit_logs` (`id`, `super_admin_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `created_at`, `updated_at`) VALUES
('fa597234-d598-40ee-affa-07e3b023340e', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', 'LOGIN', 'super_admin', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', 'Super Admin "superadmin" logged in', '::1', NOW(), NOW()),
('339847a7-420d-411f-a04b-5cf526261352', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', 'CREATE_COMPANY', 'company', '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'Created company "Test Company LLC" with admin john@testcompany.com', '::1', NOW(), NOW()),
('29a84b63-e61d-42eb-b8b2-2d4eff702e28', '7e2816aa-4ecc-42f1-9d85-94b6adf02e0f', 'COMPANY_ACTIVE', 'company', '05302d74-0ae1-4aa2-97a4-f9ed2783f175', 'Changed company "Test Company LLC" status from pending_activation to active', '::1', NOW(), NOW());


-- ═══════════════════════════════════════════════
-- VERIFICATION: Row counts
-- ═══════════════════════════════════════════════
-- SELECT 'super_admins' AS tbl, COUNT(*) AS cnt FROM super_admins WHERE deleted_at IS NULL
-- UNION ALL SELECT 'super_admin_companies', COUNT(*) FROM super_admin_companies WHERE deleted_at IS NULL
-- UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans WHERE deleted_at IS NULL
-- UNION ALL SELECT 'departments', COUNT(*) FROM departments WHERE deleted_at IS NULL AND tenant_id = '05302d74-0ae1-4aa2-97a4-f9ed2783f175'
-- UNION ALL SELECT 'branches', COUNT(*) FROM branches WHERE deleted_at IS NULL AND tenant_id = '05302d74-0ae1-4aa2-97a4-f9ed2783f175'
-- UNION ALL SELECT 'designations', COUNT(*) FROM designations WHERE deleted_at IS NULL AND tenant_id = '05302d74-0ae1-4aa2-97a4-f9ed2783f175'
-- UNION ALL SELECT 'leave_types', COUNT(*) FROM leave_types WHERE deleted_at IS NULL AND tenant_id = '05302d74-0ae1-4aa2-97a4-f9ed2783f175'
-- UNION ALL SELECT 'audit_logs', COUNT(*) FROM super_admin_audit_logs;
