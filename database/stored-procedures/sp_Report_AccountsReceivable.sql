DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_AccountsReceivable$$
CREATE PROCEDURE sp_Report_AccountsReceivable(
    IN p_TenantId CHAR(36), IN p_CustomerId CHAR(36), IN p_DateFrom DATE,
    IN p_DateTo DATE, IN p_AgingAsOfDate DATE, IN p_IncludeZeroBalance TINYINT,
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_AsofDate DATE;
    DECLARE v_Offset INT DEFAULT 0;
    SET v_AsofDate = COALESCE(p_AgingAsOfDate, CURDATE());
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_ar;
    CREATE TEMPORARY TABLE tmp_ar AS
    SELECT c.id AS customer_id, c.code AS customer_code, c.name AS customer_name,
           si.id AS invoice_id, si.invoice_number, si.invoice_date, si.due_date,
           si.grand_total AS original_amount,
           COALESCE((SELECT SUM(cpa.allocated_amount) FROM customer_payment_allocations cpa
                     INNER JOIN customer_payments cp ON cp.id = cpa.customer_payment_id
                     WHERE cpa.sales_invoice_id = si.id AND cp.status = 'posted'), 0) AS paid_amount,
           si.grand_total - COALESCE((SELECT SUM(cpa.allocated_amount) FROM customer_payment_allocations cpa
                     INNER JOIN customer_payments cp ON cp.id = cpa.customer_payment_id
                     WHERE cpa.sales_invoice_id = si.id AND cp.status = 'posted'), 0) AS outstanding_amount,
           DATEDIFF(v_AsofDate, si.due_date) AS days_outstanding
    FROM customers c
    INNER JOIN sales_invoices si ON si.customer_id = c.id AND si.tenant_id = c.tenant_id
    WHERE c.tenant_id = p_TenantId AND si.status IN ('posted','paid','partially_paid')
      AND (p_CustomerId IS NULL OR c.id = p_CustomerId)
      AND (p_DateFrom IS NULL OR si.invoice_date >= p_DateFrom)
      AND (si.invoice_date <= p_DateTo OR p_DateTo IS NULL)
    HAVING (p_IncludeZeroBalance = 1 OR outstanding_amount > 0);

    -- Summary
    SELECT COALESCE(SUM(outstanding_amount),0) AS total_outstanding,
           COUNT(DISTINCT customer_id) AS total_customers,
           COUNT(*) AS total_invoices FROM tmp_ar;

    -- Detail with aging buckets
    SELECT customer_code, customer_name, invoice_number, invoice_date, due_date,
           original_amount, paid_amount, outstanding_amount, days_outstanding,
           CASE WHEN days_outstanding <= 0 THEN 'Current'
                WHEN days_outstanding BETWEEN 1 AND 30 THEN '1-30 Days'
                WHEN days_outstanding BETWEEN 31 AND 60 THEN '31-60 Days'
                WHEN days_outstanding BETWEEN 61 AND 90 THEN '61-90 Days'
                ELSE 'Over 90 Days' END AS aging_bucket
    FROM tmp_ar ORDER BY days_outstanding DESC
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_ar;
    DROP TEMPORARY TABLE tmp_ar;
END$$
DELIMITER ;
