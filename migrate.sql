ALTER TABLE ezeeflo_hr_payroll.leave_balances ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER notes;
ALTER TABLE ezeeflo_hr_payroll.leave_balances ADD COLUMN void_reason TEXT AFTER status;
