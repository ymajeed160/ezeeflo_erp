DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_SalesAnalytics$$
CREATE PROCEDURE sp_Report_SalesAnalytics(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_CustomerId CHAR(36), IN p_ItemId CHAR(36), IN p_CategoryId CHAR(36),
    IN p_WarehouseId CHAR(36), IN p_GroupBy VARCHAR(20),
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_sales;
    CREATE TEMPORARY TABLE tmp_sales AS
    SELECT sid.quantity, sid.unit_price,
           sid.discount_percent, sid.tax_percent,
           (sid.quantity * sid.unit_price) AS gross_amount,
           ((sid.quantity * sid.unit_price) * sid.discount_percent / 100) AS discount_amount,
           (((sid.quantity * sid.unit_price) - ((sid.quantity * sid.unit_price) * sid.discount_percent / 100)) * sid.tax_percent / 100) AS tax_amount,
           ((sid.quantity * sid.unit_price) - ((sid.quantity * sid.unit_price) * sid.discount_percent / 100)) AS net_amount,
           si.invoice_date, si.id AS invoice_id, c.id AS customer_id, c.name AS customer_name,
           i.id AS item_id, i.name AS item_name, ic.id AS category_id, ic.name AS category_name,
           si.warehouse_id
    FROM sales_invoice_details sid
    INNER JOIN sales_invoices si ON si.id = sid.sales_invoice_id AND si.tenant_id = p_TenantId
    LEFT JOIN customers c ON c.id = si.customer_id
    LEFT JOIN items i ON i.id = sid.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE si.status IN ('posted','paid')
      AND (p_DateFrom IS NULL OR si.invoice_date >= p_DateFrom)
      AND (si.invoice_date <= p_DateTo OR p_DateTo IS NULL)
      AND (p_CustomerId IS NULL OR si.customer_id = p_CustomerId)
      AND (p_ItemId IS NULL OR sid.item_id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_WarehouseId IS NULL OR si.warehouse_id = p_WarehouseId);

    -- Summary
    SELECT COUNT(DISTINCT invoice_id) AS total_invoices,
           COALESCE(SUM(gross_amount),0) AS total_gross,
           COALESCE(SUM(net_amount),0) AS total_net,
           COALESCE(SUM(tax_amount),0) AS total_tax,
           COALESCE(SUM(discount_amount),0) AS total_discount,
           COALESCE(SUM(quantity),0) AS total_quantity,
           CASE WHEN COUNT(DISTINCT invoice_id) > 0
                THEN COALESCE(SUM(net_amount),0)/COUNT(DISTINCT invoice_id) ELSE 0 END AS avg_invoice_value
    FROM tmp_sales;

    -- Grouped data
    SELECT
        CASE p_GroupBy
            WHEN 'Day' THEN DATE_FORMAT(invoice_date, '%Y-%m-%d')
            WHEN 'Week' THEN DATE_FORMAT(invoice_date, '%Y-%u')
            WHEN 'Month' THEN DATE_FORMAT(invoice_date, '%Y-%m')
            WHEN 'Customer' THEN customer_name
            WHEN 'Item' THEN item_name
            WHEN 'Category' THEN category_name
            ELSE DATE_FORMAT(invoice_date, '%Y-%m')
        END AS group_name,
        COALESCE(SUM(gross_amount),0) AS gross_sales,
        COALESCE(SUM(discount_amount),0) AS discount,
        COALESCE(SUM(tax_amount),0) AS tax,
        COALESCE(SUM(net_amount),0) AS net_sales,
        COALESCE(SUM(quantity),0) AS quantity,
        COUNT(DISTINCT invoice_id) AS invoice_count
    FROM tmp_sales
    GROUP BY group_name
    ORDER BY group_name
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(DISTINCT
        CASE p_GroupBy
            WHEN 'Day' THEN DATE_FORMAT(invoice_date, '%Y-%m-%d')
            WHEN 'Week' THEN DATE_FORMAT(invoice_date, '%Y-%u')
            WHEN 'Month' THEN DATE_FORMAT(invoice_date, '%Y-%m')
            WHEN 'Customer' THEN customer_name
            WHEN 'Item' THEN item_name
            WHEN 'Category' THEN category_name
            ELSE DATE_FORMAT(invoice_date, '%Y-%m')
        END) AS total FROM tmp_sales;

    DROP TEMPORARY TABLE tmp_sales;
END$$
DELIMITER ;
