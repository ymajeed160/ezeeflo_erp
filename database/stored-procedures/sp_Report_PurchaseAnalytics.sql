DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_PurchaseAnalytics$$
CREATE PROCEDURE sp_Report_PurchaseAnalytics(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_SupplierId CHAR(36), IN p_ItemId CHAR(36), IN p_CategoryId CHAR(36),
    IN p_WarehouseId CHAR(36), IN p_GroupBy VARCHAR(20),
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_purchases;
    CREATE TEMPORARY TABLE tmp_purchases AS
    SELECT pid.quantity, pid.unit_cost, pid.tax_amount, pid.discount_amount,
           (pid.quantity * pid.unit_cost) AS gross_amount,
           ((pid.quantity * pid.unit_cost) - pid.discount_amount) AS net_amount,
           pi.invoice_date, pi.id AS invoice_id, s.id AS supplier_id, s.name AS supplier_name,
           i.id AS item_id, i.name AS item_name, ic.id AS category_id, ic.name AS category_name,
           pi.warehouse_id
    FROM PurchaseInvoiceDetails pid
    INNER JOIN PurchaseInvoices pi ON pi.id = pid.purchase_invoice_id AND pi.tenant_id = p_TenantId
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    LEFT JOIN items i ON i.id = pid.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE pi.status IN ('posted','paid')
      AND (p_DateFrom IS NULL OR pi.invoice_date >= p_DateFrom)
      AND (pi.invoice_date <= p_DateTo OR p_DateTo IS NULL)
      AND (p_SupplierId IS NULL OR pi.supplier_id = p_SupplierId)
      AND (p_ItemId IS NULL OR pid.item_id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_WarehouseId IS NULL OR pi.warehouse_id = p_WarehouseId);

    -- Summary
    SELECT COUNT(DISTINCT invoice_id) AS total_invoices,
           COALESCE(SUM(gross_amount),0) AS total_gross,
           COALESCE(SUM(net_amount),0) AS total_net,
           COALESCE(SUM(tax_amount),0) AS total_tax,
           COALESCE(SUM(discount_amount),0) AS total_discount,
           COALESCE(SUM(quantity),0) AS total_quantity,
           CASE WHEN COUNT(DISTINCT invoice_id) > 0
                THEN COALESCE(SUM(net_amount),0)/COUNT(DISTINCT invoice_id) ELSE 0 END AS avg_invoice_value
    FROM tmp_purchases;

    -- Grouped data
    SELECT
        CASE p_GroupBy
            WHEN 'Day' THEN DATE_FORMAT(invoice_date, '%Y-%m-%d')
            WHEN 'Week' THEN DATE_FORMAT(invoice_date, '%Y-%u')
            WHEN 'Month' THEN DATE_FORMAT(invoice_date, '%Y-%m')
            WHEN 'Supplier' THEN supplier_name
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
    FROM tmp_purchases
    GROUP BY group_name
    ORDER BY group_name
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(DISTINCT
        CASE p_GroupBy
            WHEN 'Day' THEN DATE_FORMAT(invoice_date, '%Y-%m-%d')
            WHEN 'Week' THEN DATE_FORMAT(invoice_date, '%Y-%u')
            WHEN 'Month' THEN DATE_FORMAT(invoice_date, '%Y-%m')
            WHEN 'Supplier' THEN supplier_name
            WHEN 'Item' THEN item_name
            WHEN 'Category' THEN category_name
            ELSE DATE_FORMAT(invoice_date, '%Y-%m')
        END) AS total FROM tmp_purchases;

    DROP TEMPORARY TABLE tmp_purchases;
END$$
DELIMITER ;
