DROP PROCEDURE IF EXISTS sp_overtime_report;

DELIMITER //

CREATE PROCEDURE sp_overtime_report(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE, IN p_employee_id CHAR(36))
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
END //

DELIMITER ;
