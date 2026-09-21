DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_AccountsPayable$$
CREATE PROCEDURE sp_Report_AccountsPayable(
    IN p_TenantId CHAR(36), IN p_SupplierId CHAR(36), IN p_DateFrom DATE,
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

    DROP TEMPORARY TABLE IF EXISTS tmp_ap;
    CREATE TEMPORARY TABLE tmp_ap AS
    SELECT s.id AS supplier_id, s.code AS supplier_code, s.name AS supplier_name,
           pi.id AS invoice_id, pi.invoice_number, pi.supplier_invoice_number,
           pi.invoice_date, pi.due_date, pi.total_amount AS original_amount,
           COALESCE((SELECT SUM(spa.allocated_amount) FROM supplier_payment_allocations spa
                     INNER JOIN supplier_payments sp ON sp.id = spa.supplier_payment_id
                     WHERE spa.purchase_invoice_id = pi.id AND sp.status = 'posted'), 0) AS paid_amount,
           pi.total_amount - COALESCE((SELECT SUM(spa.allocated_amount) FROM supplier_payment_allocations spa
                     INNER JOIN supplier_payments sp ON sp.id = spa.supplier_payment_id
                     WHERE spa.purchase_invoice_id = pi.id AND sp.status = 'posted'), 0) AS outstanding_amount,
           DATEDIFF(v_AsofDate, pi.due_date) AS days_outstanding
    FROM suppliers s
    INNER JOIN purchaseinvoices pi ON pi.supplier_id = s.id AND pi.tenant_id = s.tenant_id
    WHERE s.tenant_id = p_TenantId AND pi.status IN ('posted','paid')
      AND (p_SupplierId IS NULL OR s.id = p_SupplierId)
      AND (p_DateFrom IS NULL OR pi.invoice_date >= p_DateFrom)
      AND (pi.invoice_date <= p_DateTo OR p_DateTo IS NULL)
    HAVING (p_IncludeZeroBalance = 1 OR outstanding_amount > 0);

    SELECT COALESCE(SUM(outstanding_amount),0) AS total_outstanding,
           COUNT(DISTINCT supplier_id) AS total_suppliers, COUNT(*) AS total_invoices FROM tmp_ap;

    SELECT supplier_code, supplier_name, invoice_number, supplier_invoice_number,
           invoice_date, due_date, original_amount, paid_amount, outstanding_amount,
           days_outstanding,
           CASE WHEN days_outstanding <= 0 THEN 'Current'
                WHEN days_outstanding BETWEEN 1 AND 30 THEN '1-30 Days'
                WHEN days_outstanding BETWEEN 31 AND 60 THEN '31-60 Days'
                WHEN days_outstanding BETWEEN 61 AND 90 THEN '61-90 Days'
                ELSE 'Over 90 Days' END AS aging_bucket
    FROM tmp_ap ORDER BY days_outstanding DESC
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_ap;
    DROP TEMPORARY TABLE tmp_ap;
END$$
DELIMITER ;
