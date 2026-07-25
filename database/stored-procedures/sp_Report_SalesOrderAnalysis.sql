DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_SalesOrderAnalysis$$
CREATE PROCEDURE sp_Report_SalesOrderAnalysis(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_CustomerId CHAR(36), IN p_Status VARCHAR(50),
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_so;
    CREATE TEMPORARY TABLE tmp_so AS
    SELECT so.id, so.order_number, so.order_date, so.delivery_date, so.status,
           so.subtotal_amount, so.discount_amount, so.tax_amount, so.total_amount,
           c.id AS customer_id, c.name AS customer_name,
           w.name AS warehouse_name
    FROM sales_orders so
    LEFT JOIN customers c ON c.id = so.customer_id
    LEFT JOIN warehouses w ON w.id = so.warehouse_id
    WHERE so.tenant_id = p_TenantId
      AND (p_DateFrom IS NULL OR so.order_date >= p_DateFrom)
      AND (so.order_date <= p_DateTo OR p_DateTo IS NULL)
      AND (p_CustomerId IS NULL OR so.customer_id = p_CustomerId)
      AND (p_Status IS NULL OR so.status = p_Status);

    SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(total_amount),0) AS total_amount,
           COALESCE(AVG(total_amount),0) AS avg_order_value,
           COALESCE(SUM(discount_amount),0) AS total_discount,
           COALESCE(SUM(tax_amount),0) AS total_tax
    FROM tmp_so;

    SELECT order_number, order_date, status, customer_name, warehouse_name,
           subtotal_amount, discount_amount, tax_amount, total_amount
    FROM tmp_so
    ORDER BY order_date DESC
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_so;
    DROP TEMPORARY TABLE tmp_so;
END$$
DELIMITER ;
