DROP PROCEDURE IF EXISTS sp_eosb_report;

DELIMITER //

CREATE PROCEDURE sp_eosb_report(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE)
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
END //

DELIMITER ;
