DROP PROCEDURE IF EXISTS sp_attendance_report;

DELIMITER //

CREATE PROCEDURE sp_attendance_report(IN p_tenant_id CHAR(36), IN p_date_from DATE, IN p_date_to DATE, IN p_employee_id CHAR(36))
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
END //

DELIMITER ;
