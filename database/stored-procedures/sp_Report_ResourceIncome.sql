DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_ResourceIncome$$
CREATE PROCEDURE sp_Report_ResourceIncome(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_ResourceId CHAR(36), IN p_ResourceTypeId CHAR(36),
    IN p_CustomerId CHAR(36), IN p_InvoiceNumber VARCHAR(50),
    IN p_Status VARCHAR(20),
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_TotalRecords INT DEFAULT 0;

    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_resource_income;
    CREATE TEMPORARY TABLE tmp_resource_income AS
    SELECT
        ri.id,
        ri.sales_invoice_id,
        ri.resource_id,
        ri.invoice_number,
        ri.invoice_date,
        ri.customer_id,
        ri.net_amount,
        ri.tax_amount,
        ri.gross_amount,
        ri.income_amount,
        ri.status AS invoice_status,
        sr.resource_code,
        sr.resource_name,
        srt.id AS resource_type_id,
        srt.type_code,
        srt.type_name,
        c.name AS customer_name,
        COALESCE(c.currency, 'AED') AS currency
    FROM resource_income ri
    INNER JOIN selling_resources sr ON sr.id = ri.resource_id AND sr.tenant_id = p_TenantId
    LEFT JOIN selling_resource_types srt ON srt.id = sr.resource_type_id
    LEFT JOIN customers c ON c.id = ri.customer_id
    WHERE ri.tenant_id = p_TenantId
      AND (p_DateFrom IS NULL OR ri.invoice_date >= p_DateFrom)
      AND (p_DateTo IS NULL OR ri.invoice_date <= p_DateTo)
      AND (p_ResourceId IS NULL OR ri.resource_id = p_ResourceId)
      AND (p_ResourceTypeId IS NULL OR sr.resource_type_id = p_ResourceTypeId)
      AND (p_CustomerId IS NULL OR ri.customer_id = p_CustomerId)
      AND (p_InvoiceNumber IS NULL OR ri.invoice_number LIKE CONCAT('%', p_InvoiceNumber, '%'))
      AND (
            (p_Status IS NULL AND ri.status = 'posted')
            OR (p_Status = 'all')
            OR (ri.status = p_Status)
          );

    -- Result set 1: Summary totals
    SELECT
        COUNT(DISTINCT sales_invoice_id) AS total_invoices,
        COALESCE(SUM(net_amount), 0) AS total_net,
        COALESCE(SUM(tax_amount), 0) AS total_tax,
        COALESCE(SUM(gross_amount), 0) AS total_gross,
        COALESCE(SUM(gross_amount), 0) AS total_sales,
        COALESCE(SUM(income_amount), 0) AS total_income
    FROM tmp_resource_income;

    -- Result set 2: Detailed data
    SELECT
        resource_code,
        resource_name,
        COALESCE(type_code, '') AS resource_type_code,
        COALESCE(type_name, '') AS resource_type,
        invoice_number,
        invoice_date,
        COALESCE(customer_name, '') AS customer_name,
        net_amount,
        tax_amount,
        gross_amount,
        income_amount,
        currency,
        invoice_status
    FROM tmp_resource_income
    ORDER BY invoice_date DESC, invoice_number DESC
    LIMIT p_PageSize OFFSET v_Offset;

    -- Result set 3: Pagination metadata
    SELECT COUNT(*) INTO v_TotalRecords FROM tmp_resource_income;
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;

    DROP TEMPORARY TABLE tmp_resource_income;
END$$
DELIMITER ;
