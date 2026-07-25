DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_SalesInvoiceTrends$$
CREATE PROCEDURE sp_Report_SalesInvoiceTrends(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_CustomerId CHAR(36), IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_sit;
    CREATE TEMPORARY TABLE tmp_sit AS
    SELECT si.id, si.invoice_number, si.invoice_date, si.due_date, si.status,
           si.sub_total, si.tax_total, si.discount_total, si.grand_total,
           c.id AS customer_id, c.name AS customer_name,
           w.name AS warehouse_name
    FROM sales_invoices si
    LEFT JOIN customers c ON c.id = si.customer_id
    LEFT JOIN warehouses w ON w.id = si.warehouse_id
    WHERE si.tenant_id = p_TenantId
      AND (p_DateFrom IS NULL OR si.invoice_date >= p_DateFrom)
      AND (si.invoice_date <= p_DateTo OR p_DateTo IS NULL)
      AND (p_CustomerId IS NULL OR si.customer_id = p_CustomerId);

    SELECT COUNT(*) AS total_invoices,
           COALESCE(SUM(grand_total),0) AS total_amount,
           COALESCE(AVG(grand_total),0) AS avg_invoice_value,
           COALESCE(SUM(tax_total),0) AS total_tax,
           COALESCE(SUM(discount_total),0) AS total_discount
    FROM tmp_sit;

    SELECT invoice_number, invoice_date, status, customer_name,
           sub_total, discount_total, tax_total, grand_total
    FROM tmp_sit
    ORDER BY invoice_date DESC
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_sit;
    DROP TEMPORARY TABLE tmp_sit;
END$$
DELIMITER ;
