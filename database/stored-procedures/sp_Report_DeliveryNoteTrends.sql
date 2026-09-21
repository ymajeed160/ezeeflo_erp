DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_DeliveryNoteTrends$$
CREATE PROCEDURE sp_Report_DeliveryNoteTrends(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_CustomerId CHAR(36), IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_dnt;
    CREATE TEMPORARY TABLE tmp_dnt AS
    SELECT dn.id, dn.delivery_number, dn.delivery_date, dn.status, dn.total_amount,
           c.id AS customer_id, c.name AS customer_name,
           w.name AS warehouse_name
    FROM delivery_notes dn
    LEFT JOIN customers c ON c.id = dn.customer_id
    LEFT JOIN warehouses w ON w.id = dn.warehouse_id
    WHERE dn.tenant_id = p_TenantId
      AND (p_DateFrom IS NULL OR dn.delivery_date >= p_DateFrom)
      AND (dn.delivery_date <= p_DateTo OR p_DateTo IS NULL)
      AND (p_CustomerId IS NULL OR dn.customer_id = p_CustomerId);

    SELECT COUNT(*) AS total_delivery_notes,
           COALESCE(SUM(total_amount),0) AS total_amount,
           COALESCE(AVG(total_amount),0) AS avg_delivery_value
    FROM tmp_dnt;

    SELECT delivery_number, delivery_date, status, customer_name, warehouse_name, total_amount
    FROM tmp_dnt
    ORDER BY delivery_date DESC
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_dnt;
    DROP TEMPORARY TABLE tmp_dnt;
END$$
DELIMITER ;
