-- ============================================================
-- EzeeFlo HR & Payroll -- Stored Procedures & Functions
-- MariaDB 10.11 Compatible (DEFINER removed)
-- Run after tables are created
-- ============================================================

DELIMITER //
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

CREATE PROCEDURE `sp_department_summary`(IN p_tenant_id CHAR(36))
BEGIN SELECT d.name AS department, d.code AS department_code, COUNT(e.id) AS total_employees, SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) AS active_employees, SUM(CASE WHEN e.gender = 'Male' THEN 1 ELSE 0 END) AS male_count, SUM(CASE WHEN e.gender = 'Female' THEN 1 ELSE 0 END) AS female_count, AVG(e.basic_salary) AS avg_basic_salary, SUM(e.total_salary) AS total_salary_cost FROM departments d LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL WHERE d.tenant_id = p_tenant_id AND d.deleted_at IS NULL GROUP BY d.id, d.name, d.code ORDER BY total_employees DESC; END ;;

CREATE PROCEDURE `sp_employee_report`(IN p_tenant_id CHAR(36), IN p_status VARCHAR(50), IN p_department_id CHAR(36))
BEGIN SELECT e.employee_code, e.first_name, e.last_name, e.gender, e.nationality, e.work_email, e.mobile_number, e.joining_date, e.contract_end_date, d.name AS department, des.name AS designation, b.name AS branch, e.basic_salary, e.total_salary, e.status FROM employees e LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL LEFT JOIN designations des ON des.id = e.designation_id AND des.deleted_at IS NULL LEFT JOIN branches b ON b.id = e.branch_id AND b.deleted_at IS NULL WHERE e.tenant_id = p_tenant_id AND e.deleted_at IS NULL AND (p_status IS NULL OR p_status = '' OR e.status = p_status) AND (p_department_id IS NULL OR p_department_id = '' OR e.department_id = p_department_id) ORDER BY e.employee_code; END ;;

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

CREATE PROCEDURE `sp_headcount_report`(IN p_tenant_id CHAR(36), IN p_as_of_date DATE)
BEGIN SELECT SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) AS active_count, SUM(CASE WHEN e.status = 'Inactive' THEN 1 ELSE 0 END) AS inactive_count, SUM(CASE WHEN e.status = 'On Leave' THEN 1 ELSE 0 END) AS on_leave_count, SUM(CASE WHEN e.status IN ('Terminated', 'Resigned', 'Retired') THEN 1 ELSE 0 END) AS separated_count, COUNT(e.id) AS total_headcount, AVG(e.total_salary) AS avg_salary, SUM(e.total_salary) AS total_salary_budget FROM employees e WHERE e.tenant_id = p_tenant_id AND e.deleted_at IS NULL AND (p_as_of_date IS NULL OR e.joining_date <= p_as_of_date); END ;;

CREATE PROCEDURE `sp_leave_balance_report`(IN p_tenant_id CHAR(36), IN p_year INT, IN p_employee_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, d.name AS department, lt.code AS leave_code, lt.name AS leave_type, lt.leave_category, lb.opening_balance, lb.accrued_days, lb.used_days, lb.pending_days, lb.available_balance, lb.carry_forward_days FROM leave_balances lb JOIN employees e ON e.id = lb.employee_id AND e.deleted_at IS NULL JOIN leave_types lt ON lt.id = lb.leave_type_id AND lt.deleted_at IS NULL LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL WHERE lb.tenant_id = p_tenant_id AND lb.deleted_at IS NULL AND lb.year = p_year AND (p_employee_id IS NULL OR p_employee_id = '' OR lb.employee_id = p_employee_id) ORDER BY e.employee_code, lt.leave_category; END ;;

CREATE PROCEDURE `sp_loan_report`(IN p_tenant_id CHAR(36), IN p_status VARCHAR(50))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, el.loan_number, el.loan_type, el.principal_amount, el.monthly_installment, el.total_installments, el.paid_installments, el.remaining_amount, el.start_date, el.end_date, el.status FROM employee_loans el JOIN employees e ON e.id = el.employee_id AND e.deleted_at IS NULL WHERE el.tenant_id = p_tenant_id AND el.deleted_at IS NULL AND (p_status IS NULL OR p_status = '' OR el.status = p_status) ORDER BY el.created_at DESC; END ;;

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

CREATE PROCEDURE `sp_payroll_register`(IN p_tenant_id CHAR(36), IN p_payroll_run_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, d.name AS department, des.name AS designation, pd.basic_salary, pd.allowances, pd.deductions, pd.overtime_pay, pd.loan_deduction, pd.gross_pay, pd.net_pay, pd.employer_contributions, pd.working_days, pd.paid_days, pd.absent_days FROM payroll_details pd JOIN employees e ON e.id = pd.employee_id AND e.deleted_at IS NULL LEFT JOIN departments d ON d.id = e.department_id AND d.deleted_at IS NULL LEFT JOIN designations des ON des.id = e.designation_id AND des.deleted_at IS NULL WHERE pd.tenant_id = p_tenant_id AND pd.deleted_at IS NULL AND pd.payroll_run_id = p_payroll_run_id ORDER BY e.employee_code; END ;;

CREATE PROCEDURE `sp_performance_report`(IN p_tenant_id CHAR(36), IN p_employee_id CHAR(36))
BEGIN SELECT e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, pa.appraisal_date, pa.period_from, pa.period_to, pa.overall_rating, pa.strengths, pa.improvements, pa.status, CONCAT(apr.first_name, ' ', apr.last_name) AS appraiser_name FROM performance_appraisals pa JOIN employees e ON e.id = pa.employee_id AND e.deleted_at IS NULL LEFT JOIN employees apr ON apr.id = pa.appraiser_id AND apr.deleted_at IS NULL WHERE pa.tenant_id = p_tenant_id AND pa.deleted_at IS NULL AND (p_employee_id IS NULL OR p_employee_id = '' OR pa.employee_id = p_employee_id) ORDER BY pa.appraisal_date DESC; END ;;

CREATE PROCEDURE `sp_training_report`(IN p_tenant_id CHAR(36), IN p_course_id CHAR(36))
BEGIN SELECT tc.code AS course_code, tc.name AS course_name, tc.category, ts.session_name, ts.start_date, ts.end_date, ts.trainer_name, ts.status AS session_status, COUNT(ta.id) AS total_enrolled, SUM(CASE WHEN ta.attendance_status = 'Attended' THEN 1 ELSE 0 END) AS attended_count, SUM(CASE WHEN ta.attendance_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count, AVG(ta.score) AS avg_score FROM training_courses tc JOIN training_sessions ts ON ts.course_id = tc.id AND ts.deleted_at IS NULL LEFT JOIN training_attendees ta ON ta.session_id = ts.id AND ta.deleted_at IS NULL WHERE tc.tenant_id = p_tenant_id AND tc.deleted_at IS NULL AND (p_course_id IS NULL OR p_course_id = '' OR tc.id = p_course_id) GROUP BY tc.id, tc.code, tc.name, tc.category, ts.id, ts.session_name, ts.start_date, ts.end_date, ts.trainer_name, ts.status ORDER BY ts.start_date DESC; END ;;

DELIMITER ;

