-- ============================================================
-- POS Stored Procedures for EzeeFlo ERP
-- All procedures follow the existing sp_Report_* naming convention:
--   Result 1: Summary (aggregated totals - single row)
--   Result 2: Data (paginated detail rows)
--   Result 3: Pagination (page, page_size, total_records, total_pages)
-- ============================================================

-- ============================================================
-- 1. Daily Sales Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_DailySales;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_DailySales(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36),
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT CONCAT(DATE(ps.invoice_date), '-', ps.terminal_id)) INTO v_TotalRecords
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 1: Summary
    SELECT 
        COALESCE(SUM(ps.grand_total), 0) as total_sales,
        COALESCE(SUM(ps.tax_total), 0) as total_tax,
        COALESCE(SUM(ps.discount_total), 0) as total_discount,
        COALESCE(SUM(ps.sub_total), 0) as total_subtotal,
        COUNT(DISTINCT ps.id) as transaction_count,
        COALESCE(AVG(ps.grand_total), 0) as avg_transaction,
        COALESCE(SUM(CASE WHEN pp.payment_method = 'cash' THEN pp.amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN pp.payment_method = 'card' THEN pp.amount ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN pp.payment_method = 'bank_transfer' THEN pp.amount ELSE 0 END), 0) as bank_sales,
        COALESCE(SUM(CASE WHEN pp.payment_method = 'credit' THEN pp.amount ELSE 0 END), 0) as credit_sales
    FROM pos_sales ps
    LEFT JOIN pos_payments pp ON pp.pos_sale_id = ps.id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 2: Data
    SELECT 
        DATE(ps.invoice_date) as sale_date,
        pt.terminal_name,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(ps.grand_total) as total_sales,
        SUM(ps.tax_total) as total_tax,
        SUM(ps.discount_total) as total_discount,
        SUM(ps.sub_total) as total_subtotal,
        AVG(ps.grand_total) as avg_transaction,
        SUM(CASE WHEN pp.payment_method = 'cash' THEN pp.amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN pp.payment_method = 'card' THEN pp.amount ELSE 0 END) as card_sales,
        SUM(CASE WHEN pp.payment_method = 'bank_transfer' THEN pp.amount ELSE 0 END) as bank_sales,
        SUM(CASE WHEN pp.payment_method = 'credit' THEN pp.amount ELSE 0 END) as credit_sales
    FROM pos_sales ps
    JOIN pos_terminals pt ON pt.id = ps.terminal_id
    LEFT JOIN pos_payments pp ON pp.pos_sale_id = ps.id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)
    GROUP BY DATE(ps.invoice_date), pt.terminal_name
    ORDER BY sale_date DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 2. Sales by Cashier
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_SalesByCashier;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_SalesByCashier(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT ps.user_id) INTO v_TotalRecords
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT ps.user_id) as total_cashiers,
        COUNT(DISTINCT ps.id) as total_transactions,
        COALESCE(SUM(ps.grand_total), 0) as total_sales,
        COALESCE(SUM(ps.tax_total), 0) as total_tax,
        COALESCE(SUM(ps.discount_total), 0) as total_discount,
        COALESCE(AVG(ps.grand_total), 0) as avg_transaction
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 2: Data
    SELECT 
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        u.username,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(ps.grand_total) as total_sales,
        SUM(ps.tax_total) as total_tax,
        SUM(ps.discount_total) as total_discount,
        AVG(ps.grand_total) as avg_transaction,
        COUNT(DISTINCT ps.session_id) as session_count
    FROM pos_sales ps
    JOIN users u ON u.id = ps.user_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    GROUP BY u.id, u.first_name, u.last_name, u.username
    ORDER BY total_sales DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 3. Sales by Terminal
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_SalesByTerminal;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_SalesByTerminal(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_TotalRecords
    FROM pos_terminals pt
    WHERE pt.tenant_id = p_TenantId AND pt.is_active = 1;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT pt.id) as total_terminals,
        COUNT(DISTINCT ps.id) as total_transactions,
        COALESCE(SUM(ps.grand_total), 0) as total_sales,
        COALESCE(SUM(ps.tax_total), 0) as total_tax,
        COALESCE(SUM(ps.discount_total), 0) as total_discount,
        COALESCE(AVG(ps.grand_total), 0) as avg_transaction
    FROM pos_terminals pt
    LEFT JOIN pos_sales ps ON ps.terminal_id = pt.id AND ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    WHERE pt.tenant_id = p_TenantId AND pt.is_active = 1;
    
    -- Result set 2: Data
    SELECT 
        pt.id as terminal_id,
        pt.terminal_name,
        pt.terminal_code,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(ps.grand_total) as total_sales,
        SUM(ps.tax_total) as total_tax,
        SUM(ps.discount_total) as total_discount,
        COUNT(DISTINCT ps.user_id) as unique_cashiers,
        COUNT(DISTINCT ps.session_id) as session_count
    FROM pos_sales ps
    RIGHT JOIN pos_terminals pt ON pt.id = ps.terminal_id AND ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    WHERE pt.tenant_id = p_TenantId AND pt.is_active = 1
    GROUP BY pt.id, pt.terminal_name, pt.terminal_code
    ORDER BY total_sales DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 4. Sales by Item
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_SalesByItem;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_SalesByItem(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_CategoryId VARCHAR(36),
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT psl.item_id) INTO v_TotalRecords
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId);
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT psl.item_id) as total_items_sold,
        COALESCE(SUM(psl.quantity), 0) as total_quantity,
        COALESCE(SUM(psl.line_total), 0) as total_revenue,
        COALESCE(SUM(psl.discount_amount), 0) as total_discount,
        COALESCE(SUM(psl.tax_amount), 0) as total_tax,
        COALESCE(AVG(psl.unit_price), 0) as avg_unit_price
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId);
    
    -- Result set 2: Data
    SELECT 
        i.id as item_id,
        i.name as item_name,
        i.item_code as sku,
        ic.name as category_name,
        i.item_type,
        SUM(psl.quantity) as total_quantity,
        SUM(psl.line_total) as total_revenue,
        SUM(psl.discount_amount) as total_discount,
        SUM(psl.tax_amount) as total_tax,
        AVG(psl.unit_price) as avg_price,
        COUNT(DISTINCT ps.id) as sale_count
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
    GROUP BY i.id, i.name, i.item_code, ic.name, i.item_type
    ORDER BY total_quantity DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 5. Payment Method Summary
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_PaymentSummary;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_PaymentSummary(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36)
)
BEGIN
    DECLARE v_TotalAmount DECIMAL(18,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(pp.amount), 0) INTO v_TotalAmount
    FROM pos_payments pp
    JOIN pos_sales ps ON ps.id = pp.pos_sale_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT pp.payment_method) as total_methods,
        COALESCE(SUM(pp.amount), 0) as total_amount,
        COUNT(DISTINCT pp.pos_sale_id) as total_transactions
    FROM pos_payments pp
    JOIN pos_sales ps ON ps.id = pp.pos_sale_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 2: Data
    SELECT 
        pp.payment_method,
        COUNT(DISTINCT pp.pos_sale_id) as transaction_count,
        SUM(pp.amount) as total_amount,
        AVG(pp.amount) as avg_amount,
        CASE WHEN v_TotalAmount > 0 THEN ROUND(SUM(pp.amount) / v_TotalAmount * 100, 2) ELSE 0 END as percentage
    FROM pos_payments pp
    JOIN pos_sales ps ON ps.id = pp.pos_sale_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)
    GROUP BY pp.payment_method
    ORDER BY total_amount DESC;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size, 
        (SELECT COUNT(DISTINCT pp.payment_method) FROM pos_payments pp
         JOIN pos_sales ps ON ps.id = pp.pos_sale_id
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
           AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 6. Hourly Sales
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_HourlySales;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_HourlySales(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36)
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT ps.id) as total_transactions,
        COALESCE(SUM(ps.grand_total), 0) as total_sales,
        COALESCE(AVG(ps.grand_total), 0) as avg_sale,
        COUNT(DISTINCT HOUR(ps.created_at)) as active_hours
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 2: Data
    SELECT 
        HOUR(ps.created_at) as hour_of_day,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(ps.grand_total) as total_sales,
        AVG(ps.grand_total) as avg_sale
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)
    GROUP BY HOUR(ps.created_at)
    ORDER BY hour_of_day;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size, 
        (SELECT COUNT(DISTINCT HOUR(created_at)) FROM pos_sales 
         WHERE tenant_id = p_TenantId AND status = 'completed'
         AND invoice_date BETWEEN p_DateFrom AND p_DateTo
         AND (p_TerminalId IS NULL OR terminal_id = p_TerminalId)) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 7. Top Selling Items
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_TopItems;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_TopItems(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Limit INT
)
BEGIN
    IF p_Limit IS NULL OR p_Limit <= 0 THEN SET p_Limit = 20; END IF;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT i.id) as total_items,
        COALESCE(SUM(psl.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(psl.line_total), 0) as total_revenue
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 2: Data
    SELECT 
        i.id as item_id,
        i.name as item_name,
        i.item_code as sku,
        ic.name as category_name,
        SUM(psl.quantity) as total_quantity_sold,
        SUM(psl.line_total) as total_revenue,
        COUNT(DISTINCT ps.id) as sale_count
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    GROUP BY i.id, i.name, i.item_code, ic.name
    ORDER BY total_quantity_sold DESC
    LIMIT p_Limit;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, p_Limit AS page_size, 
        (SELECT COUNT(DISTINCT i.id) FROM pos_sale_lines psl
         JOIN pos_sales ps ON ps.id = psl.pos_sale_id
         JOIN items i ON i.id = psl.item_id
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 8. Cashier Session Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_CashierSession;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_CashierSession(
    p_TenantId VARCHAR(36),
    p_SessionId VARCHAR(36)
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COALESCE(ps.cash_sales_total, 0) + COALESCE(ps.card_sales_total, 0) + COALESCE(ps.bank_sales_total, 0) + COALESCE(ps.credit_sales_total, 0) as total_collected,
        ps.cash_difference,
        CASE 
            WHEN ps.cash_difference > 0 THEN 'Overage'
            WHEN ps.cash_difference < 0 THEN 'Shortage'
            ELSE 'Balanced'
        END as variance_status,
        ps.total_sales_count
    FROM pos_sessions ps
    WHERE ps.tenant_id = p_TenantId AND ps.id = p_SessionId;
    
    -- Result set 2: Data
    SELECT 
        ps.id as session_id,
        ps.session_number,
        pt.terminal_name,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        ps.opening_date,
        ps.closing_date,
        ps.opening_cash,
        ps.expected_cash,
        ps.actual_cash,
        ps.cash_difference,
        ps.cash_sales_total,
        ps.card_sales_total,
        ps.bank_sales_total,
        ps.credit_sales_total,
        ps.cash_in_total,
        ps.cash_out_total,
        ps.refund_total,
        ps.total_sales_count,
        ps.status,
        ps.opening_notes,
        ps.closing_notes,
        ps.manager_approved
    FROM pos_sessions ps
    JOIN pos_terminals pt ON pt.id = ps.terminal_id
    JOIN users u ON u.id = ps.user_id
    WHERE ps.tenant_id = p_TenantId AND ps.id = p_SessionId;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 1 AS page_size, 1 AS total_records, 1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 9. Cash Variance Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_CashVariance;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_CashVariance(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36)
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(ABS(ps.cash_difference)), 0) as total_absolute_variance,
        SUM(CASE WHEN ps.cash_difference > 0 THEN 1 ELSE 0 END) as overage_count,
        SUM(CASE WHEN ps.cash_difference < 0 THEN 1 ELSE 0 END) as shortage_count,
        SUM(CASE WHEN ps.cash_difference = 0 THEN 1 ELSE 0 END) as balanced_count
    FROM pos_sessions ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'closed'
      AND DATE(ps.opening_date) BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId);
    
    -- Result set 2: Data
    SELECT 
        ps.id as session_id,
        ps.session_number,
        pt.terminal_name,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        ps.opening_date,
        ps.closing_date,
        ps.expected_cash,
        ps.actual_cash,
        ps.cash_difference,
        ABS(ps.cash_difference) as absolute_variance,
        CASE 
            WHEN ps.cash_difference > 0 THEN 'Overage'
            WHEN ps.cash_difference < 0 THEN 'Shortage'
            ELSE 'Balanced'
        END as variance_type,
        ps.manager_approved,
        ps.closing_notes
    FROM pos_sessions ps
    JOIN pos_terminals pt ON pt.id = ps.terminal_id
    JOIN users u ON u.id = ps.user_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'closed'
      AND DATE(ps.opening_date) BETWEEN p_DateFrom AND p_DateTo
      AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)
    ORDER BY absolute_variance DESC;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(*) FROM pos_sessions ps
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'closed'
           AND DATE(ps.opening_date) BETWEEN p_DateFrom AND p_DateTo
           AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 10. Returns Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_Returns;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_Returns(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_TotalRecords
    FROM pos_returns pr
    WHERE pr.tenant_id = p_TenantId
      AND pr.status = 'completed'
      AND pr.return_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(*) as total_returns,
        COALESCE(SUM(pr.grand_total), 0) as total_return_amount,
        COALESCE(SUM(pr.refund_amount), 0) as total_refund_amount,
        COUNT(DISTINCT pr.customer_id) as unique_customers
    FROM pos_returns pr
    WHERE pr.tenant_id = p_TenantId
      AND pr.status = 'completed'
      AND pr.return_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 2: Data
    SELECT 
        pr.id as return_id,
        pr.return_number,
        pr.original_invoice_number,
        pr.return_date,
        pr.grand_total as return_total,
        pr.refund_amount,
        pr.refund_method,
        pr.reason,
        c.name as customer_name,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        pt.terminal_name,
        pr.created_at
    FROM pos_returns pr
    JOIN customers c ON c.id = pr.customer_id
    JOIN users u ON u.id = pr.user_id
    JOIN pos_terminals pt ON pt.id = pr.terminal_id
    WHERE pr.tenant_id = p_TenantId
      AND pr.status = 'completed'
      AND pr.return_date BETWEEN p_DateFrom AND p_DateTo
    ORDER BY pr.created_at DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 11. Discount Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_Discounts;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_Discounts(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_TotalRecords
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND ps.discount_total > 0;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(*) as total_discounted_sales,
        COALESCE(SUM(ps.discount_total), 0) as total_discount_amount,
        COALESCE(AVG(ps.discount_total), 0) as avg_discount_per_sale,
        COALESCE(SUM(ps.grand_total), 0) as total_sales_after_discount
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND ps.discount_total > 0;
    
    -- Result set 2: Data
    SELECT 
        ps.id as sale_id,
        ps.invoice_number,
        ps.invoice_date,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        ps.discount_total,
        ps.discount_percentage,
        ps.discount_reason,
        ps.grand_total,
        ROUND(ps.discount_total / NULLIF(ps.sub_total, 0) * 100, 2) as discount_pct_of_sale
    FROM pos_sales ps
    JOIN users u ON u.id = ps.user_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND ps.discount_total > 0
    ORDER BY ps.discount_total DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 12. Tax Report
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_Tax;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_Tax(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT ps.id) as total_transactions,
        COALESCE(SUM(ps.sub_total), 0) as total_taxable_amount,
        COALESCE(SUM(ps.tax_total), 0) as total_tax,
        COALESCE(SUM(ps.grand_total), 0) as total_including_tax,
        COALESCE(AVG(ps.tax_total / NULLIF(ps.sub_total, 0) * 100), 0) as avg_tax_rate
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND ps.tax_total > 0;
    
    -- Result set 2: Data
    SELECT 
        ps.invoice_date,
        COUNT(DISTINCT ps.id) as invoice_count,
        SUM(ps.sub_total) as total_taxable,
        SUM(ps.tax_total) as total_tax,
        SUM(ps.grand_total) as total_including_tax,
        AVG(ps.tax_total / NULLIF(ps.sub_total, 0) * 100) as avg_tax_rate
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND ps.tax_total > 0
    GROUP BY ps.invoice_date
    ORDER BY ps.invoice_date;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(DISTINCT ps.invoice_date) FROM pos_sales ps
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
           AND ps.tax_total > 0) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 13. Stock Sold Through POS
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_StockSold;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_StockSold(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_WarehouseId VARCHAR(36)
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT i.id) as total_items_sold,
        COALESCE(SUM(psl.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(psl.line_total), 0) as total_revenue,
        COUNT(DISTINCT w.id) as warehouses_affected
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    JOIN warehouses w ON w.id = ps.warehouse_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_WarehouseId IS NULL OR ps.warehouse_id = p_WarehouseId)
      AND i.is_inventory_tracked = 1;
    
    -- Result set 2: Data
    SELECT 
        w.name as warehouse_name,
        i.name as item_name,
        i.item_code,
        ic.name as category_name,
        SUM(psl.quantity) as total_quantity_sold,
        SUM(psl.line_total) as total_revenue,
        COALESCE(ib.quantity_on_hand, 0) as current_stock
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    JOIN warehouses w ON w.id = ps.warehouse_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN inventory_balances ib ON ib.item_id = i.id AND ib.warehouse_id = ps.warehouse_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
      AND (p_WarehouseId IS NULL OR ps.warehouse_id = p_WarehouseId)
      AND i.is_inventory_tracked = 1
    GROUP BY w.name, i.name, i.item_code, ic.name, ib.quantity_on_hand
    ORDER BY total_quantity_sold DESC;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(DISTINCT CONCAT(psl.item_id, '-', ps.warehouse_id)) FROM pos_sale_lines psl
         JOIN pos_sales ps ON ps.id = psl.pos_sale_id
         JOIN items i ON i.id = psl.item_id
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
           AND (p_WarehouseId IS NULL OR ps.warehouse_id = p_WarehouseId)
           AND i.is_inventory_tracked = 1) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 14. Sales by Category
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_SalesByCategory;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_SalesByCategory(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE
)
BEGIN
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT ic.id) as total_categories,
        COALESCE(SUM(psl.quantity), 0) as total_quantity,
        COALESCE(SUM(psl.line_total), 0) as total_revenue,
        COALESCE(SUM(psl.tax_amount), 0) as total_tax,
        COALESCE(SUM(psl.discount_amount), 0) as total_discount
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 2: Data
    SELECT 
        ic.id as category_id,
        ic.name as category_name,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(psl.quantity) as total_quantity,
        SUM(psl.line_total) as total_revenue,
        SUM(psl.tax_amount) as total_tax,
        SUM(psl.discount_amount) as total_discount
    FROM pos_sale_lines psl
    JOIN pos_sales ps ON ps.id = psl.pos_sale_id
    JOIN items i ON i.id = psl.item_id
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    GROUP BY ic.id, ic.name
    ORDER BY total_revenue DESC;
    
    -- Result set 3: Pagination
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(DISTINCT ic.id) FROM pos_sale_lines psl
         JOIN pos_sales ps ON ps.id = psl.pos_sale_id
         JOIN items i ON i.id = psl.item_id
         LEFT JOIN item_categories ic ON ic.id = i.category_id
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

-- ============================================================
-- 15. Sales by Customer
-- ============================================================
DROP PROCEDURE IF EXISTS sp_Report_POS_SalesByCustomer;
DELIMITER $$
CREATE PROCEDURE sp_Report_POS_SalesByCustomer(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Page INT,
    p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT (p_Page - 1) * p_PageSize;
    DECLARE v_TotalRecords INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT ps.customer_id) INTO v_TotalRecords
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 1: Summary
    SELECT 
        COUNT(DISTINCT ps.customer_id) as total_customers,
        COUNT(DISTINCT ps.id) as total_transactions,
        COALESCE(SUM(ps.grand_total), 0) as total_sales,
        COALESCE(AVG(ps.grand_total), 0) as avg_transaction,
        COALESCE(SUM(ps.discount_total), 0) as total_discount
    FROM pos_sales ps
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo;
    
    -- Result set 2: Data
    SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.code as customer_code,
        c.phone,
        COUNT(DISTINCT ps.id) as transaction_count,
        SUM(ps.grand_total) as total_spent,
        AVG(ps.grand_total) as avg_transaction,
        MAX(ps.invoice_date) as last_purchase_date,
        SUM(ps.discount_total) as total_discount_received
    FROM pos_sales ps
    JOIN customers c ON c.id = ps.customer_id
    WHERE ps.tenant_id = p_TenantId
      AND ps.status = 'completed'
      AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
    GROUP BY c.id, c.name, c.code, c.phone
    ORDER BY total_spent DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    -- Result set 3: Pagination
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;
