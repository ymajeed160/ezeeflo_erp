-- Report stored procedures that were missing from the ezeefloc_erp schema.
-- Source: erp_mt_suite, adapted to the current ezeefloc_erp table/column names.
-- Adjusted definitions: sp_Report_StockAdjustmentHistory, sp_Report_StockTransferHistory, sp_Report_BankTransactionSummary, sp_Report_PurchaseReceiptTrends, sp_Report_ReceivedItemsToBeBilled, sp_Report_ResourceIncome

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_get_account_details`$$
CREATE PROCEDURE `sp_get_account_details`(
    IN p_tenant_id CHAR(36),
    IN p_account_id CHAR(36)
)
BEGIN
    SELECT 
        a.id,
        a.tenant_id,
        a.name,
        a.code,
        a.type,
        a.opening_balance,
        a.is_active
    FROM accounts a
    WHERE a.tenant_id = p_tenant_id 
      AND a.id = p_account_id;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_GeneralLedger`$$
CREATE PROCEDURE `sp_Report_GeneralLedger`(
    IN p_TenantId CHAR(36),
    IN p_AccountId CHAR(36),
    IN p_DateFrom DATE,
    IN p_DateTo DATE,
    IN p_JournalNumber VARCHAR(50),
    IN p_ReferenceNumber VARCHAR(100),
    IN p_Page INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_OpeningDebit DECIMAL(18,2) DEFAULT 0;
    DECLARE v_OpeningCredit DECIMAL(18,2) DEFAULT 0;
    DECLARE v_OpeningBalance DECIMAL(18,2) DEFAULT 0;
    DECLARE v_PeriodDebit DECIMAL(18,2) DEFAULT 0;
    DECLARE v_PeriodCredit DECIMAL(18,2) DEFAULT 0;
    DECLARE v_ClosingBalance DECIMAL(18,2) DEFAULT 0;
    DECLARE v_AccountType VARCHAR(20);
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_TotalRecords INT DEFAULT 0;

    -- Set defaults
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    IF p_DateTo IS NULL THEN SET p_DateTo = CURDATE(); END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    -- If no account specified, return data for ALL accounts
    IF p_AccountId IS NULL THEN
        -- Opening balance across all accounts
        SELECT COALESCE(SUM(jel.debit), 0), COALESCE(SUM(jel.credit), 0)
        INTO v_OpeningDebit, v_OpeningCredit
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
        INNER JOIN accounts a ON a.id = jel.account_id AND a.tenant_id = p_TenantId
        WHERE je.tenant_id = p_TenantId
          AND je.status = 'posted'
          AND je.deleted_at IS NULL
          AND jel.deleted_at IS NULL
          AND (p_DateFrom IS NULL OR je.entry_date < p_DateFrom);

        -- For all accounts, opening balance = total debits - total credits (net)
        SET v_OpeningBalance = v_OpeningDebit - v_OpeningCredit;

        -- Period totals across all accounts
        SELECT COALESCE(SUM(jel.debit), 0), COALESCE(SUM(jel.credit), 0)
        INTO v_PeriodDebit, v_PeriodCredit
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
        INNER JOIN accounts a ON a.id = jel.account_id AND a.tenant_id = p_TenantId
        WHERE je.tenant_id = p_TenantId
          AND je.status = 'posted'
          AND je.deleted_at IS NULL
          AND jel.deleted_at IS NULL
          AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
          AND (je.entry_date <= p_DateTo);

        SET v_ClosingBalance = v_OpeningBalance + v_PeriodDebit - v_PeriodCredit;
        SET v_AccountType = 'all';

        -- Total count
        SELECT COUNT(*)
        INTO v_TotalRecords
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
        INNER JOIN accounts a ON a.id = jel.account_id AND a.tenant_id = p_TenantId
        WHERE je.tenant_id = p_TenantId
          AND je.status = 'posted'
          AND je.deleted_at IS NULL
          AND jel.deleted_at IS NULL
          AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
          AND (je.entry_date <= p_DateTo)
          AND (p_JournalNumber IS NULL OR je.entry_number LIKE CONCAT('%', p_JournalNumber, '%'))
          AND (p_ReferenceNumber IS NULL OR je.reference LIKE CONCAT('%', p_ReferenceNumber, '%'));

        CREATE TEMPORARY TABLE IF NOT EXISTS tmp_gl_transactions (
            row_num INT AUTO_INCREMENT PRIMARY KEY,
            transaction_date DATE,
            journal_number VARCHAR(50),
            account_code VARCHAR(50),
            account_name VARCHAR(200),
            reference_number VARCHAR(100),
            description VARCHAR(255),
            debit DECIMAL(18,2),
            credit DECIMAL(18,2),
            running_balance DECIMAL(18,2)
        );

        SET @running_bal = v_OpeningBalance;

        INSERT INTO tmp_gl_transactions (transaction_date, journal_number, account_code, account_name, reference_number, description, debit, credit, running_balance)
        SELECT je.entry_date AS transaction_date,
               je.entry_number AS journal_number,
               a.code AS account_code,
               a.name AS account_name,
               je.reference AS reference_number,
               jel.description,
               jel.debit,
               jel.credit,
               @running_bal := @running_bal + jel.debit - jel.credit
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
        INNER JOIN accounts a ON a.id = jel.account_id AND a.tenant_id = p_TenantId
        WHERE je.tenant_id = p_TenantId
          AND je.status = 'posted'
          AND je.deleted_at IS NULL
          AND jel.deleted_at IS NULL
          AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
          AND (je.entry_date <= p_DateTo)
          AND (p_JournalNumber IS NULL OR je.entry_number LIKE CONCAT('%', p_JournalNumber, '%'))
          AND (p_ReferenceNumber IS NULL OR je.reference LIKE CONCAT('%', p_ReferenceNumber, '%'))
        ORDER BY je.entry_date ASC, je.created_at ASC;

    ELSE
        -- Original logic for a specific account
        -- Get the account type for balance calculation
        SELECT a.type INTO v_AccountType
        FROM accounts a
        WHERE a.id = p_AccountId AND a.tenant_id = p_TenantId;

    -- ============================================
    -- OPENING BALANCE: SUM of all posted journal entry lines BEFORE the date range
    -- ============================================
    SELECT COALESCE(SUM(jel.debit), 0), COALESCE(SUM(jel.credit), 0)
    INTO v_OpeningDebit, v_OpeningCredit
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE jel.account_id = p_AccountId
      AND je.tenant_id = p_TenantId
      AND je.status = 'posted'
      AND je.deleted_at IS NULL
      AND jel.deleted_at IS NULL
      AND (p_DateFrom IS NULL OR je.entry_date < p_DateFrom);

    -- Calculate opening balance based on account type
    -- Asset/Expense: Opening + Debit - Credit
    -- Liability/Equity/Revenue: Opening - Debit + Credit
    IF v_AccountType IN ('asset', 'expense') THEN
        SET v_OpeningBalance = v_OpeningDebit - v_OpeningCredit;
    ELSE
        SET v_OpeningBalance = v_OpeningCredit - v_OpeningDebit;
    END IF;

    -- ============================================
    -- PERIOD TOTALS (for summary)
    -- ============================================
    SELECT COALESCE(SUM(jel.debit), 0), COALESCE(SUM(jel.credit), 0)
    INTO v_PeriodDebit, v_PeriodCredit
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE jel.account_id = p_AccountId
      AND je.tenant_id = p_TenantId
      AND je.status = 'posted'
      AND je.deleted_at IS NULL
      AND jel.deleted_at IS NULL
      AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
      AND (je.entry_date <= p_DateTo);

    -- Closing balance
    IF v_AccountType IN ('asset', 'expense') THEN
        SET v_ClosingBalance = v_OpeningBalance + v_PeriodDebit - v_PeriodCredit;
    ELSE
        SET v_ClosingBalance = v_OpeningBalance - v_PeriodDebit + v_PeriodCredit;
    END IF;

    -- ============================================
    -- DETAILED TRANSACTIONS (paginated)
    -- ============================================
    -- First, get total count
    SELECT COUNT(*)
    INTO v_TotalRecords
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE jel.account_id = p_AccountId
      AND je.tenant_id = p_TenantId
      AND je.status = 'posted'
      AND je.deleted_at IS NULL
      AND jel.deleted_at IS NULL
      AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
      AND (je.entry_date <= p_DateTo)
      AND (p_JournalNumber IS NULL OR je.entry_number LIKE CONCAT('%', p_JournalNumber, '%'))
      AND (p_ReferenceNumber IS NULL OR je.reference LIKE CONCAT('%', p_ReferenceNumber, '%'));

    -- Return transactions with running balance
    -- Pre-compute running balance using a variable to avoid MySQL's
    -- "Can't reopen table" limitation on temporary tables.
    CREATE TEMPORARY TABLE IF NOT EXISTS tmp_gl_transactions (
        row_num INT AUTO_INCREMENT PRIMARY KEY,
        transaction_date DATE,
        journal_number VARCHAR(50),
        account_code VARCHAR(50),
        account_name VARCHAR(200),
        reference_number VARCHAR(100),
        description VARCHAR(255),
        debit DECIMAL(18,2),
        credit DECIMAL(18,2),
        running_balance DECIMAL(18,2)
    );

    -- Set initial running balance
    SET @running_bal = v_OpeningBalance;

    INSERT INTO tmp_gl_transactions (transaction_date, journal_number, account_code, account_name, reference_number, description, debit, credit, running_balance)
    SELECT je.entry_date AS transaction_date,
           je.entry_number AS journal_number,
           a.code AS account_code,
           a.name AS account_name,
           je.reference AS reference_number,
           jel.description,
           jel.debit,
           jel.credit,
           -- Compute running balance inline using MySQL variable
           @running_bal := CASE
               WHEN v_AccountType IN ('asset', 'expense')
                   THEN @running_bal + jel.debit - jel.credit
               ELSE @running_bal - jel.debit + jel.credit
           END
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    INNER JOIN accounts a ON a.id = jel.account_id AND a.tenant_id = p_TenantId
    WHERE jel.account_id = p_AccountId
      AND je.tenant_id = p_TenantId
      AND je.status = 'posted'
      AND je.deleted_at IS NULL
      AND jel.deleted_at IS NULL
      AND (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom)
      AND (je.entry_date <= p_DateTo)
      AND (p_JournalNumber IS NULL OR je.entry_number LIKE CONCAT('%', p_JournalNumber, '%'))
      AND (p_ReferenceNumber IS NULL OR je.reference LIKE CONCAT('%', p_ReferenceNumber, '%'))
    ORDER BY je.entry_date ASC, je.created_at ASC;

    END IF;

    -- Result set 1: Opening + Period + Closing summary
    SELECT
        v_OpeningBalance AS opening_balance,
        v_PeriodDebit AS total_debit,
        v_PeriodCredit AS total_credit,
        v_ClosingBalance AS closing_balance,
        v_AccountType AS account_type;

    -- Result set 2: Paginated transactions with running balance
    SELECT
        t.transaction_date,
        t.journal_number,
        t.account_code,
        t.account_name,
        t.reference_number,
        t.description,
        t.debit,
        t.credit,
        t.running_balance
    FROM tmp_gl_transactions t
    ORDER BY t.row_num ASC
    LIMIT p_PageSize OFFSET v_Offset;

    -- Result set 3: Pagination metadata
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;

    DROP TEMPORARY TABLE IF EXISTS tmp_gl_transactions;

END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_GrossProfit`$$
CREATE PROCEDURE `sp_Report_GrossProfit`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT si.invoice_number,si.invoice_date,si.grand_total AS revenue,COALESCE((SELECT SUM(sid2.quantity*sid2.cost_price) FROM sales_invoice_details sid2 WHERE sid2.sales_invoice_id=si.id),0) AS cogs FROM sales_invoices si WHERE si.tenant_id=p_TenantId AND si.status IN ('posted','paid') AND (p_DateFrom IS NULL OR si.invoice_date>=p_DateFrom) AND (si.invoice_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_invoices,COALESCE(SUM(revenue),0) AS total_revenue,COALESCE(SUM(cogs),0) AS total_cogs,COALESCE(SUM(revenue),0)-COALESCE(SUM(cogs),0) AS gross_profit FROM tmp;
SELECT invoice_number,invoice_date,revenue,cogs,(revenue-cogs) AS profit FROM tmp ORDER BY invoice_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_InactiveCustomers`$$
CREATE PROCEDURE `sp_Report_InactiveCustomers`(IN p_TenantId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT c.name,c.email,c.phone,c.status,COALESCE((SELECT MAX(invoice_date) FROM sales_invoices WHERE customer_id=c.id),NULL) AS last_transaction_date FROM customers c WHERE c.tenant_id=p_TenantId AND c.status='inactive';
SELECT COUNT(*) AS total_inactive_customers FROM tmp;
SELECT name,email,phone,status,last_transaction_date FROM tmp ORDER BY name LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_InventoryAging`$$
CREATE PROCEDURE `sp_Report_InventoryAging`(
    IN p_TenantId CHAR(36),
    IN p_ReportDate DATE,
    IN p_WarehouseId CHAR(36),
    IN p_ItemId CHAR(36),
    IN p_CategoryId CHAR(36),
    IN p_ItemType VARCHAR(20),
    IN p_IncludeZeroStock TINYINT,
    IN p_AgingBucket VARCHAR(20),
    IN p_Page INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_ReportDate DATE;

    IF p_ReportDate IS NULL THEN SET v_ReportDate = CURDATE(); ELSE SET v_ReportDate = p_ReportDate; END IF;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_inflows;
    CREATE TEMPORARY TABLE tmp_inflows AS
    SELECT t.item_id, t.warehouse_id, DATE(t.transaction_date) AS layer_date,
           t.quantity_in AS layer_qty, t.id AS tx_id
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.quantity_in > 0
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY);

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_outflows;
    CREATE TEMPORARY TABLE tmp_outflows AS
    SELECT t.item_id, t.warehouse_id, SUM(t.quantity_out) AS total_out
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.quantity_out > 0
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY)
    GROUP BY t.item_id, t.warehouse_id;

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_onhand;
    CREATE TEMPORARY TABLE tmp_onhand AS
    SELECT t.item_id, t.warehouse_id,
           (SUM(COALESCE(t.quantity_in,0)) - SUM(COALESCE(t.quantity_out,0))) AS on_hand
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY)
    GROUP BY t.item_id, t.warehouse_id
    HAVING on_hand <> 0;

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_layers;
    CREATE TEMPORARY TABLE tmp_layers (
        item_id CHAR(36),
        warehouse_id CHAR(36),
        layer_date DATE,
        layer_qty DECIMAL(18,4),
        KEY idx_layer (item_id, warehouse_id)
    ) ENGINE=MEMORY;

    SET @qc_item := NULL, @qc_wh := NULL, @qc_alloc := 0;

    INSERT INTO tmp_layers (item_id, warehouse_id, layer_date, layer_qty)
    SELECT x.item_id, x.warehouse_id, x.layer_date,
           LEAST(x.layer_qty, x.on_hand - x.alloc_before) AS surviving_qty
    FROM (
        SELECT f.item_id, f.warehouse_id, f.layer_date, f.layer_qty,
               h.on_hand,
               @qc_alloc := IF(@qc_item = f.item_id AND @qc_wh = f.warehouse_id, @qc_alloc, 0) AS alloc_before,
               @qc_alloc := @qc_alloc + f.layer_qty AS alloc_after,
               @qc_item := f.item_id,
               @qc_wh := f.warehouse_id
        FROM tmp_inflows f
        JOIN tmp_onhand h ON h.item_id = f.item_id AND h.warehouse_id = f.warehouse_id
        ORDER BY f.item_id, f.warehouse_id, f.layer_date DESC, f.tx_id DESC
        LIMIT 18446744073709551615
    ) x
    WHERE x.on_hand > 0
      AND x.alloc_before < x.on_hand
      AND LEAST(x.layer_qty, x.on_hand - x.alloc_before) > 0;

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_summary;
    CREATE TEMPORARY TABLE tmp_summary AS
    SELECT
        i.id AS item_id,
        l.warehouse_id,
        i.item_code,
        i.name AS item_name,
        ic.name AS category_name,
        w.name AS warehouse_name,
        i.item_type,
        SUM(l.layer_qty) AS current_qty,
        COALESCE(ib.average_cost, i.cost_price, 0) AS unit_cost,
        (SUM(l.layer_qty) * COALESCE(ib.average_cost, i.cost_price, 0)) AS inventory_value,
        MIN(l.layer_date) AS receipt_date,
        DATEDIFF(v_ReportDate, MIN(l.layer_date)) AS max_days_held,
        (SUM(DATEDIFF(v_ReportDate, l.layer_date) * l.layer_qty) / NULLIF(SUM(l.layer_qty), 0)) AS avg_days_held
    FROM tmp_layers l
    JOIN items i ON i.id = l.item_id AND i.tenant_id = p_TenantId
    JOIN warehouses w ON w.id = l.warehouse_id AND w.tenant_id = p_TenantId
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN inventory_balances ib ON ib.item_id = l.item_id AND ib.warehouse_id = l.warehouse_id
    GROUP BY i.id, l.warehouse_id, i.item_code, i.name, ic.name, w.name, i.item_type,
             ib.average_cost, i.cost_price;

    
    
    
    IF p_IncludeZeroStock = 1 THEN
        INSERT INTO tmp_summary
            (item_id, warehouse_id, item_code, item_name, category_name, warehouse_name,
             item_type, current_qty, unit_cost, inventory_value, receipt_date, max_days_held, avg_days_held)
        SELECT i.id, w.id, i.item_code, i.name, ic.name, w.name, i.item_type,
               0, COALESCE(ib.average_cost, i.cost_price, 0), 0,
               NULL, 0, 0
        FROM items i
        JOIN warehouses w ON w.tenant_id = i.tenant_id
        LEFT JOIN item_categories ic ON ic.id = i.category_id
        LEFT JOIN inventory_balances ib ON ib.item_id = i.id AND ib.warehouse_id = w.id
        WHERE i.tenant_id = p_TenantId
          AND (p_WarehouseId IS NULL OR w.id = p_WarehouseId)
          AND (p_ItemId IS NULL OR i.id = p_ItemId)
          AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
          AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
          AND NOT EXISTS (
              SELECT 1 FROM tmp_layers l WHERE l.item_id = i.id AND l.warehouse_id = w.id
          );
    END IF;

    
    
    
    DROP TEMPORARY TABLE IF EXISTS tmp_result;
    CREATE TEMPORARY TABLE tmp_result AS
    SELECT s.*,
        CASE
            WHEN s.receipt_date IS NULL THEN NULL
            WHEN s.max_days_held <= 30 THEN '0-30'
            WHEN s.max_days_held <= 60 THEN '31-60'
            WHEN s.max_days_held <= 90 THEN '61-90'
            WHEN s.max_days_held <= 180 THEN '91-180'
            WHEN s.max_days_held <= 365 THEN '181-365'
            ELSE '365+'
        END AS aging_bucket
    FROM tmp_summary s
    WHERE (p_WarehouseId IS NULL OR s.warehouse_id = p_WarehouseId)
      AND (p_ItemId IS NULL OR s.item_id = p_ItemId)
      AND (p_ItemType IS NULL OR s.item_type = p_ItemType);

    DELETE FROM tmp_result
    WHERE (p_CategoryId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM items i WHERE i.id = tmp_result.item_id AND i.category_id = p_CategoryId
    ));

    IF p_AgingBucket IS NOT NULL AND p_AgingBucket <> '' THEN
        DELETE FROM tmp_result WHERE aging_bucket <> p_AgingBucket;
    END IF;

    
    
    
    SELECT COUNT(*) AS total_items,
           COALESCE(SUM(current_qty),0) AS total_quantity,
           COALESCE(SUM(inventory_value),0) AS total_value
    FROM tmp_result;

    
    
    
    SELECT item_code, item_name, category_name, warehouse_name, item_type,
           current_qty, unit_cost, inventory_value,
           receipt_date, avg_days_held, max_days_held, aging_bucket
    FROM tmp_result
    ORDER BY inventory_value DESC, item_code ASC, warehouse_name ASC
    LIMIT p_PageSize OFFSET v_Offset;

    
    
    
    SELECT COUNT(*) AS total, p_Page AS page, p_PageSize AS page_size FROM tmp_result;

    
    
    
    SELECT i.item_code, i.name AS item_name, ic.name AS category_name, w.name AS warehouse_name,
           l.layer_date,
           l.layer_qty AS remaining_qty,
           COALESCE(ib.average_cost, i.cost_price, 0) AS unit_cost,
           (l.layer_qty * COALESCE(ib.average_cost, i.cost_price, 0)) AS layer_value,
           DATEDIFF(v_ReportDate, l.layer_date) AS days_held,
           CASE
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 30 THEN '0-30'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 60 THEN '31-60'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 90 THEN '61-90'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 180 THEN '91-180'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 365 THEN '181-365'
               ELSE '365+'
           END AS aging_bucket
    FROM tmp_layers l
    JOIN items i ON i.id = l.item_id AND i.tenant_id = p_TenantId
    JOIN warehouses w ON w.id = l.warehouse_id AND w.tenant_id = p_TenantId
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN inventory_balances ib ON ib.item_id = l.item_id AND ib.warehouse_id = l.warehouse_id
    WHERE (p_WarehouseId IS NULL OR l.warehouse_id = p_WarehouseId)
      AND (p_ItemId IS NULL OR l.item_id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
      AND (p_AgingBucket IS NULL OR p_AgingBucket = '' OR
           (CASE
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 30 THEN '0-30'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 60 THEN '31-60'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 90 THEN '61-90'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 180 THEN '91-180'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 365 THEN '181-365'
               ELSE '365+'
           END) = p_AgingBucket)
    ORDER BY i.item_code, l.layer_date ASC;

    DROP TEMPORARY TABLE IF EXISTS tmp_inflows;
    DROP TEMPORARY TABLE IF EXISTS tmp_outflows;
    DROP TEMPORARY TABLE IF EXISTS tmp_onhand;
    DROP TEMPORARY TABLE IF EXISTS tmp_layers;
    DROP TEMPORARY TABLE IF EXISTS tmp_summary;
    DROP TEMPORARY TABLE IF EXISTS tmp_result;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ItemLedger`$$
CREATE PROCEDURE `sp_Report_ItemLedger`(IN p_TenantId CHAR(36),IN p_ItemId CHAR(36),IN p_WarehouseId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT it.transaction_date,it.transaction_type,it.quantity_in,it.quantity_out,it.running_balance,it.unit_cost,i.item_code,i.name AS item_name,w.name AS warehouse_name,it.reference_type,it.reference_id FROM inventory_transactions it JOIN items i ON i.id=it.item_id JOIN warehouses w ON w.id=it.warehouse_id WHERE it.tenant_id=p_TenantId AND (p_ItemId IS NULL OR it.item_id=p_ItemId) AND (p_WarehouseId IS NULL OR it.warehouse_id=p_WarehouseId) AND (p_DateFrom IS NULL OR it.transaction_date>=p_DateFrom) AND (it.transaction_date<=p_DateTo OR p_DateTo IS NULL); SELECT COUNT(*) AS total_transactions,COALESCE(SUM(quantity_in),0) AS total_in,COALESCE(SUM(quantity_out),0) AS total_out FROM tmp; SELECT transaction_date,transaction_type,item_code,item_name,warehouse_name,quantity_in,quantity_out,running_balance,unit_cost FROM tmp ORDER BY transaction_date DESC LIMIT p_PageSize OFFSET v_Offset; SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ItemWisePurchaseHistory`$$
CREATE PROCEDURE `sp_Report_ItemWisePurchaseHistory`(IN p_TenantId CHAR(36),IN p_ItemId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT pi.invoice_number,pi.invoice_date,i.name AS item_name,pid.quantity,pid.unit_cost,pid.line_total,s.name AS supplier_name FROM PurchaseInvoiceDetails pid JOIN PurchaseInvoices pi ON pi.id=pid.purchase_invoice_id JOIN items i ON i.id=pid.item_id LEFT JOIN suppliers s ON s.id=pi.supplier_id WHERE pi.tenant_id=p_TenantId AND pi.status IN ('posted','paid') AND (p_ItemId IS NULL OR pid.item_id=p_ItemId) AND (p_DateFrom IS NULL OR pi.invoice_date>=p_DateFrom) AND (pi.invoice_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_purchases,COALESCE(SUM(quantity),0) AS total_quantity,COALESCE(SUM(line_total),0) AS total_amount FROM tmp;
SELECT invoice_number,invoice_date,item_name,quantity,unit_cost,line_total,supplier_name FROM tmp ORDER BY invoice_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_LowStock`$$
CREATE PROCEDURE `sp_Report_LowStock`(IN p_TenantId CHAR(36),IN p_WarehouseId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT i.item_code,i.name AS item_name,w.name AS warehouse_name,ib.quantity_on_hand,ib.average_cost,10 AS min_stock_level FROM inventory_balances ib JOIN items i ON i.id=ib.item_id JOIN warehouses w ON w.id=ib.warehouse_id WHERE ib.tenant_id=p_TenantId AND ib.quantity_on_hand<=10 AND ib.quantity_on_hand>0 AND (p_WarehouseId IS NULL OR ib.warehouse_id=p_WarehouseId);
SELECT COUNT(*) AS total_low_stock_items FROM tmp;
SELECT item_code,item_name,warehouse_name,quantity_on_hand,min_stock_level,average_cost FROM tmp ORDER BY quantity_on_hand ASC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PaymentReceiptSummary`$$
CREATE PROCEDURE `sp_Report_PaymentReceiptSummary`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_CustomerId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT pr.receipt_number,pr.receipt_date,pr.amount,pr.payment_method,pr.status,c.name AS customer_name,ba.account_name FROM payment_receipts pr LEFT JOIN customers c ON c.id=pr.customer_id LEFT JOIN bank_accounts ba ON ba.id=pr.bank_account_id WHERE pr.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR pr.receipt_date>=p_DateFrom) AND (pr.receipt_date<=p_DateTo OR p_DateTo IS NULL);SELECT COUNT(*) AS total_receipts,COALESCE(SUM(amount),0) AS total_amount FROM tmp;SELECT receipt_number,receipt_date,customer_name,amount,payment_method,status,account_name FROM tmp ORDER BY receipt_date DESC LIMIT p_PageSize OFFSET v_Offset;SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PaymentVoucherSummary`$$
CREATE PROCEDURE `sp_Report_PaymentVoucherSummary`(
      IN p_TenantId CHAR(36),
      IN p_DateFrom DATE,
      IN p_DateTo DATE,
      IN p_SupplierId CHAR(36),
      IN p_Page INT,
      IN p_PageSize INT
    )
BEGIN
      DECLARE v_Offset INT DEFAULT 0;
      
      IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
      IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
      SET v_Offset = (p_Page - 1) * p_PageSize;
      
      DROP TEMPORARY TABLE IF EXISTS tmp;
      
      CREATE TEMPORARY TABLE tmp AS
      SELECT 
        pv.voucher_number,
        pv.voucher_date,
        pv.amount,
        pv.payment_method,
        pv.status,
        s.name AS supplier_name,
        ba.account_name
      FROM payment_vouchers pv
      LEFT JOIN suppliers s ON s.id = pv.supplier_id
      LEFT JOIN bank_accounts ba ON ba.id = pv.bank_account_id
      WHERE pv.tenant_id = p_TenantId
        AND (p_DateFrom IS NULL OR pv.voucher_date >= p_DateFrom)
        AND (pv.voucher_date <= p_DateTo OR p_DateTo IS NULL);
      
      SELECT 
        COUNT(*) AS total_vouchers,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM tmp;
      
      SELECT 
        voucher_number,
        voucher_date,
        supplier_name,
        amount,
        payment_method,
        status,
        account_name
      FROM tmp
      ORDER BY voucher_date DESC
      LIMIT p_PageSize OFFSET v_Offset;
      
      SELECT COUNT(*) AS total FROM tmp;
      
      DROP TEMPORARY TABLE tmp;
    END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_CashierSession`$$
CREATE PROCEDURE `sp_Report_POS_CashierSession`(
    p_TenantId VARCHAR(36),
    p_SessionId VARCHAR(36)
)
BEGIN
    
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
    
    
    SELECT 1 AS page, 1 AS page_size, 1 AS total_records, 1 AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_CashVariance`$$
CREATE PROCEDURE `sp_Report_POS_CashVariance`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36)
)
BEGIN
    
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
    
    
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(*) FROM pos_sessions ps
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'closed'
           AND DATE(ps.opening_date) BETWEEN p_DateFrom AND p_DateTo
           AND (p_TerminalId IS NULL OR ps.terminal_id = p_TerminalId)) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_DailySales`$$
CREATE PROCEDURE `sp_Report_POS_DailySales`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_Discounts`$$
CREATE PROCEDURE `sp_Report_POS_Discounts`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_HourlySales`$$
CREATE PROCEDURE `sp_Report_POS_HourlySales`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_TerminalId VARCHAR(36)
)
BEGIN
    
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
    
    
    SELECT 1 AS page, 50 AS page_size, 
        (SELECT COUNT(DISTINCT HOUR(created_at)) FROM pos_sales 
         WHERE tenant_id = p_TenantId AND status = 'completed'
         AND invoice_date BETWEEN p_DateFrom AND p_DateTo
         AND (p_TerminalId IS NULL OR terminal_id = p_TerminalId)) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_PaymentSummary`$$
CREATE PROCEDURE `sp_Report_POS_PaymentSummary`(
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_Returns`$$
CREATE PROCEDURE `sp_Report_POS_Returns`(
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
    
    
    SELECT 
        COUNT(*) as total_returns,
        COALESCE(SUM(pr.grand_total), 0) as total_return_amount,
        COALESCE(SUM(pr.refund_amount), 0) as total_refund_amount,
        COUNT(DISTINCT pr.customer_id) as unique_customers
    FROM pos_returns pr
    WHERE pr.tenant_id = p_TenantId
      AND pr.status = 'completed'
      AND pr.return_date BETWEEN p_DateFrom AND p_DateTo;
    
    
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_SalesByCashier`$$
CREATE PROCEDURE `sp_Report_POS_SalesByCashier`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_SalesByCategory`$$
CREATE PROCEDURE `sp_Report_POS_SalesByCategory`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE
)
BEGIN
    
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_SalesByCustomer`$$
CREATE PROCEDURE `sp_Report_POS_SalesByCustomer`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_SalesByItem`$$
CREATE PROCEDURE `sp_Report_POS_SalesByItem`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_SalesByTerminal`$$
CREATE PROCEDURE `sp_Report_POS_SalesByTerminal`(
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
    
    
    SELECT
        p_Page AS page,
        p_PageSize AS page_size,
        v_TotalRecords AS total_records,
        CEIL(v_TotalRecords / p_PageSize) AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_StockSold`$$
CREATE PROCEDURE `sp_Report_POS_StockSold`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_WarehouseId VARCHAR(36)
)
BEGIN
    
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_Tax`$$
CREATE PROCEDURE `sp_Report_POS_Tax`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE
)
BEGIN
    
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
    
    
    SELECT 1 AS page, 50 AS page_size,
        (SELECT COUNT(DISTINCT ps.invoice_date) FROM pos_sales ps
         WHERE ps.tenant_id = p_TenantId
           AND ps.status = 'completed'
           AND ps.invoice_date BETWEEN p_DateFrom AND p_DateTo
           AND ps.tax_total > 0) AS total_records,
        1 AS total_pages;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_POS_TopItems`$$
CREATE PROCEDURE `sp_Report_POS_TopItems`(
    p_TenantId VARCHAR(36),
    p_DateFrom DATE,
    p_DateTo DATE,
    p_Limit INT
)
BEGIN
    IF p_Limit IS NULL OR p_Limit <= 0 THEN SET p_Limit = 20; END IF;
    
    
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ProfitabilityAnalysis`$$
CREATE PROCEDURE `sp_Report_ProfitabilityAnalysis`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT a.code,a.name,a.type,COALESCE((SELECT SUM(jel.debit) FROM journal_entry_lines jel JOIN journal_entries je ON je.id=jel.journal_entry_id WHERE jel.account_id=a.id AND je.tenant_id=p_TenantId AND je.status='posted' AND je.entry_date>=COALESCE(p_DateFrom,'2000-01-01') AND je.entry_date<=COALESCE(p_DateTo,CURDATE())),0) AS total_debit,COALESCE((SELECT SUM(jel.credit) FROM journal_entry_lines jel JOIN journal_entries je ON je.id=jel.journal_entry_id WHERE jel.account_id=a.id AND je.tenant_id=p_TenantId AND je.status='posted' AND je.entry_date>=COALESCE(p_DateFrom,'2000-01-01') AND je.entry_date<=COALESCE(p_DateTo,CURDATE())),0) AS total_credit FROM accounts a WHERE a.tenant_id=p_TenantId AND a.is_active=1 AND a.type IN ('revenue','expense');
SELECT COUNT(*) AS total_accounts,COALESCE(SUM(CASE WHEN type='revenue' THEN total_credit-total_debit ELSE 0 END),0) AS total_revenue,COALESCE(SUM(CASE WHEN type='expense' THEN total_debit-total_credit ELSE 0 END),0) AS total_expense,COALESCE(SUM(CASE WHEN type='revenue' THEN total_credit-total_debit ELSE 0 END),0)-COALESCE(SUM(CASE WHEN type='expense' THEN total_debit-total_credit ELSE 0 END),0) AS net_profit FROM tmp;
SELECT code,name,type,(CASE WHEN type='revenue' THEN total_credit-total_debit ELSE 0 END) AS amount FROM tmp ORDER BY type,code LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ProfitAndLoss`$$
CREATE PROCEDURE `sp_Report_ProfitAndLoss`(
    IN p_TenantId CHAR(36), IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_IncludeZeroBalance TINYINT, IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_AsOf DATE;
    SET v_AsOf = COALESCE(p_DateTo, CURDATE());
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_pl;
    CREATE TEMPORARY TABLE tmp_pl AS
    SELECT a.id, a.code, a.name, a.type,
           COALESCE(SUM(CASE WHEN je.entry_date >= COALESCE(p_DateFrom, '2000-01-01') AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.debit ELSE 0 END), 0) AS total_debit,
           COALESCE(SUM(CASE WHEN je.entry_date >= COALESCE(p_DateFrom, '2000-01-01') AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.credit ELSE 0 END), 0) AS total_credit
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_TenantId AND a.is_active = 1
      AND a.type IN ('revenue', 'expense')
    GROUP BY a.id, a.code, a.name, a.type;

    -- Summary
    SELECT COALESCE(SUM(CASE WHEN type='revenue' THEN total_credit - total_debit ELSE 0 END), 0) AS total_revenue,
           COALESCE(SUM(CASE WHEN type='expense' THEN total_debit - total_credit ELSE 0 END), 0) AS total_expense,
           COALESCE(SUM(CASE WHEN type='revenue' THEN total_credit - total_debit ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN type='expense' THEN total_debit - total_credit ELSE 0 END), 0) AS net_profit
    FROM tmp_pl;

    -- Detail
    SELECT code, name, type,
           ROUND(CASE WHEN type='revenue' THEN total_credit - total_debit ELSE 0 END, 2) AS revenue_amount,
           ROUND(CASE WHEN type='expense' THEN total_debit - total_credit ELSE 0 END, 2) AS expense_amount
    FROM tmp_pl
    HAVING (p_IncludeZeroBalance = 1 OR revenue_amount > 0 OR expense_amount > 0)
    ORDER BY type, code
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_pl
    WHERE (p_IncludeZeroBalance = 1
       OR (CASE WHEN type='revenue' THEN total_credit - total_debit ELSE 0 END) > 0
       OR (CASE WHEN type='expense' THEN total_debit - total_credit ELSE 0 END) > 0);
    DROP TEMPORARY TABLE tmp_pl;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PurchaseAnalytics`$$
CREATE PROCEDURE `sp_Report_PurchaseAnalytics`(
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PurchaseInvoiceTrends`$$
CREATE PROCEDURE `sp_Report_PurchaseInvoiceTrends`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_SupplierId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT pi.invoice_number,pi.invoice_date,pi.status,pi.total_amount,s.name AS supplier_name FROM PurchaseInvoices pi LEFT JOIN suppliers s ON s.id=pi.supplier_id WHERE pi.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR pi.invoice_date>=p_DateFrom) AND (pi.invoice_date<=p_DateTo OR p_DateTo IS NULL) AND (p_SupplierId IS NULL OR pi.supplier_id=p_SupplierId);
SELECT COUNT(*) AS total_invoices,COALESCE(SUM(total_amount),0) AS total_amount,COALESCE(AVG(total_amount),0) AS avg_invoice_value FROM tmp;
SELECT invoice_number,invoice_date,status,supplier_name,total_amount FROM tmp ORDER BY invoice_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PurchaseOrderAnalysis`$$
CREATE PROCEDURE `sp_Report_PurchaseOrderAnalysis`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_SupplierId CHAR(36),IN p_Status VARCHAR(50),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT po.order_number,po.order_date,po.status,po.total_amount,s.name AS supplier_name FROM PurchaseOrders po LEFT JOIN suppliers s ON s.id=po.supplier_id WHERE po.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR po.order_date>=p_DateFrom) AND (po.order_date<=p_DateTo OR p_DateTo IS NULL) AND (p_SupplierId IS NULL OR po.supplier_id=p_SupplierId) AND (p_Status IS NULL OR po.status=p_Status);
SELECT COUNT(*) AS total_orders,COALESCE(SUM(total_amount),0) AS total_amount FROM tmp;
SELECT order_number,order_date,status,supplier_name,total_amount FROM tmp ORDER BY order_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PurchaseOrderTrends`$$
CREATE PROCEDURE `sp_Report_PurchaseOrderTrends`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_SupplierId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT po.order_number,po.order_date,po.status,po.total_amount,s.name AS supplier_name FROM PurchaseOrders po LEFT JOIN suppliers s ON s.id=po.supplier_id WHERE po.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR po.order_date>=p_DateFrom) AND (po.order_date<=p_DateTo OR p_DateTo IS NULL) AND (p_SupplierId IS NULL OR po.supplier_id=p_SupplierId);
SELECT COUNT(*) AS total_orders,COALESCE(SUM(total_amount),0) AS total_amount,COALESCE(AVG(total_amount),0) AS avg_order_value FROM tmp;
SELECT order_number,order_date,status,supplier_name,total_amount FROM tmp ORDER BY order_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_PurchaseReceiptTrends`$$
CREATE PROCEDURE `sp_Report_PurchaseReceiptTrends`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_SupplierId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT gr.grn_number AS receipt_number,gr.receipt_date,gr.status,(SELECT COALESCE(SUM(grd.line_total),0) FROM goodsreceiptdetails grd WHERE grd.goods_receipt_id=gr.id) AS total_amount,s.name AS supplier_name,po.order_number FROM goodsreceipts gr LEFT JOIN suppliers s ON s.id=gr.supplier_id LEFT JOIN purchaseorders po ON po.id=gr.purchase_order_id WHERE gr.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR gr.receipt_date>=p_DateFrom) AND (gr.receipt_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_receipts,COALESCE(SUM(total_amount),0) AS total_amount FROM tmp;
SELECT receipt_number,receipt_date,status,order_number,COALESCE(supplier_name,'-') AS supplier_name,total_amount FROM tmp ORDER BY receipt_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_QuotationTrends`$$
CREATE PROCEDURE `sp_Report_QuotationTrends`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_CustomerId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT q.quotation_number,q.quotation_date,q.status,q.total_amount,c.name AS customer_name FROM quotations q LEFT JOIN customers c ON c.id=q.customer_id WHERE q.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR q.quotation_date>=p_DateFrom) AND (q.quotation_date<=p_DateTo OR p_DateTo IS NULL) AND (p_CustomerId IS NULL OR q.customer_id=p_CustomerId);
SELECT COUNT(*) AS total_quotations,COALESCE(SUM(total_amount),0) AS total_amount FROM tmp;
SELECT quotation_number,quotation_date,status,customer_name,total_amount FROM tmp ORDER BY quotation_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ReceivedItemsToBeBilled`$$
CREATE PROCEDURE `sp_Report_ReceivedItemsToBeBilled`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_SupplierId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT gr.grn_number AS receipt_number,gr.receipt_date,(SELECT COALESCE(SUM(grd.line_total),0) FROM goodsreceiptdetails grd WHERE grd.goods_receipt_id=gr.id) AS total_amount,s.name AS supplier_name FROM goodsreceipts gr LEFT JOIN suppliers s ON s.id=gr.supplier_id WHERE gr.tenant_id=p_TenantId AND gr.status='received' AND NOT EXISTS(SELECT 1 FROM purchaseinvoices pi WHERE pi.tenant_id=p_TenantId AND pi.goods_receipt_id=gr.id) AND (p_DateFrom IS NULL OR gr.receipt_date>=p_DateFrom) AND (gr.receipt_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_gr,COALESCE(SUM(total_amount),0) AS total_unbilled FROM tmp;
SELECT receipt_number,receipt_date,supplier_name,total_amount FROM tmp ORDER BY receipt_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_ResourceIncome`$$
CREATE PROCEDURE `sp_Report_ResourceIncome`(
    IN p_TenantId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci, IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_ResourceId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci, IN p_ResourceTypeId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
    IN p_CustomerId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci, IN p_InvoiceNumber VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
    IN p_Status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SalesAnalytics`$$
CREATE PROCEDURE `sp_Report_SalesAnalytics`(
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SalesInvoiceTrends`$$
CREATE PROCEDURE `sp_Report_SalesInvoiceTrends`(
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SalesOrderAnalysis`$$
CREATE PROCEDURE `sp_Report_SalesOrderAnalysis`(
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SalesOrderTrends`$$
CREATE PROCEDURE `sp_Report_SalesOrderTrends`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_CustomerId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT so.order_number,so.order_date,so.status,so.total_amount,c.name AS customer_name FROM sales_orders so LEFT JOIN customers c ON c.id=so.customer_id WHERE so.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR so.order_date>=p_DateFrom) AND (so.order_date<=p_DateTo OR p_DateTo IS NULL) AND (p_CustomerId IS NULL OR so.customer_id=p_CustomerId);
SELECT COUNT(*) AS total_orders,COALESCE(SUM(total_amount),0) AS total_amount,COALESCE(AVG(total_amount),0) AS avg_order_value FROM tmp;
SELECT order_number,order_date,status,customer_name,total_amount FROM tmp ORDER BY order_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SalesPaymentSummary`$$
CREATE PROCEDURE `sp_Report_SalesPaymentSummary`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_CustomerId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT cp.payment_number,cp.payment_date,cp.payment_method,cp.amount,cp.status,c.name AS customer_name FROM customer_payments cp LEFT JOIN customers c ON c.id=cp.customer_id WHERE cp.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR cp.payment_date>=p_DateFrom) AND (cp.payment_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_payments,COALESCE(SUM(amount),0) AS total_amount FROM tmp;
SELECT payment_number,payment_date,payment_method,amount,status,customer_name FROM tmp ORDER BY payment_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_StockAdjustmentHistory`$$
CREATE PROCEDURE `sp_Report_StockAdjustmentHistory`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT sa.adjustment_number,sa.adjustment_date,sa.status,sa.notes,w.name AS warehouse_name FROM stock_adjustments sa JOIN warehouses w ON w.id=sa.warehouse_id WHERE sa.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR sa.adjustment_date>=p_DateFrom) AND (sa.adjustment_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_adjustments FROM tmp;
SELECT adjustment_number,adjustment_date,status,warehouse_name,notes FROM tmp ORDER BY adjustment_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_StockMovementHistory`$$
CREATE PROCEDURE `sp_Report_StockMovementHistory`(
      IN p_TenantId CHAR(36),
      IN p_ItemId CHAR(36),
      IN p_WarehouseId CHAR(36),
      IN p_DateFrom DATE,
      IN p_DateTo DATE,
      IN p_Page INT,
      IN p_PageSize INT
    )
BEGIN
      DECLARE v_Offset INT DEFAULT 0;
      
      IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
      IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
      SET v_Offset = (p_Page - 1) * p_PageSize;
      
      DROP TEMPORARY TABLE IF EXISTS tmp;
      
      CREATE TEMPORARY TABLE tmp AS
      SELECT 
        it.transaction_date,
        it.transaction_type,
        it.quantity_in,
        it.quantity_out,
        it.running_balance,
        it.unit_cost,
        i.name AS item_name,
        i.item_code,
        w.name AS warehouse_name
      FROM inventory_transactions it
      JOIN items i ON i.id = it.item_id
      JOIN warehouses w ON w.id = it.warehouse_id
      WHERE it.tenant_id = p_TenantId
        AND (p_ItemId IS NULL OR it.item_id = p_ItemId)
        AND (p_WarehouseId IS NULL OR it.warehouse_id = p_WarehouseId)
        AND (p_DateFrom IS NULL OR it.transaction_date >= p_DateFrom)
        AND (it.transaction_date <= p_DateTo OR p_DateTo IS NULL);
      
      SELECT 
        COUNT(*) AS total_transactions,
        COALESCE(SUM(quantity_in), 0) AS total_in,
        COALESCE(SUM(quantity_out), 0) AS total_out
      FROM tmp;
      
      SELECT 
        transaction_date,
        transaction_type,
        item_code,
        item_name,
        warehouse_name,
        quantity_in,
        quantity_out,
        running_balance,
        unit_cost
      FROM tmp
      ORDER BY transaction_date DESC
      LIMIT p_PageSize OFFSET v_Offset;
      
      SELECT COUNT(*) AS total FROM tmp;
      
      DROP TEMPORARY TABLE tmp;
    END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_StockSummary`$$
CREATE PROCEDURE `sp_Report_StockSummary`(
    IN p_TenantId CHAR(36), IN p_WarehouseId CHAR(36), IN p_ItemId CHAR(36),
    IN p_CategoryId CHAR(36), IN p_ItemType VARCHAR(20),
    IN p_IncludeZeroStock TINYINT, IN p_IncludeInactive TINYINT,
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_stock;
    CREATE TEMPORARY TABLE tmp_stock AS
    SELECT i.item_code, i.name AS item_name,
           ic.name AS category_name, i.item_type,
           w.name AS warehouse_name,
           COALESCE(ib.quantity_on_hand, 0) AS quantity_on_hand,
           COALESCE(ib.average_cost, 0) AS avg_cost,
           COALESCE(ib.quantity_on_hand * ib.average_cost, 0) AS stock_value,
           CASE WHEN COALESCE(ib.quantity_on_hand, 0) <= 0 THEN 'Out of Stock'
                WHEN COALESCE(ib.quantity_on_hand, 0) <= 5 THEN 'Low Stock'
                ELSE 'In Stock' END AS stock_status
    FROM items i
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN warehouses w ON w.tenant_id = i.tenant_id
    LEFT JOIN inventory_balances ib ON ib.item_id = i.id AND ib.warehouse_id = w.id
    WHERE i.tenant_id = p_TenantId
      AND (p_ItemId IS NULL OR i.id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
      AND (p_WarehouseId IS NULL OR w.id = p_WarehouseId)
      AND (p_IncludeInactive = 1 OR i.is_active = 1)
    HAVING (p_IncludeZeroStock = 1 OR quantity_on_hand > 0);

    SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity_on_hand),0) AS total_quantity,
           COALESCE(SUM(stock_value),0) AS total_value FROM tmp_stock;

    SELECT * FROM tmp_stock
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_stock;
    DROP TEMPORARY TABLE tmp_stock;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_StockTransferHistory`$$
CREATE PROCEDURE `sp_Report_StockTransferHistory`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT st.transfer_number,st.transfer_date,st.status,st.notes,fw.name AS from_warehouse,tw.name AS to_warehouse FROM stock_transfers st JOIN warehouses fw ON fw.id=st.from_warehouse_id JOIN warehouses tw ON tw.id=st.to_warehouse_id WHERE st.tenant_id=p_TenantId AND (p_DateFrom IS NULL OR st.transfer_date>=p_DateFrom) AND (st.transfer_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_transfers FROM tmp;
SELECT transfer_number,transfer_date,status,from_warehouse,to_warehouse,notes FROM tmp ORDER BY transfer_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_StockValuation`$$
CREATE PROCEDURE `sp_Report_StockValuation`(IN p_TenantId CHAR(36),IN p_WarehouseId CHAR(36),IN p_CategoryId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT i.item_code,i.name AS item_name,ic.name AS category_name,w.name AS warehouse_name,ib.quantity_on_hand,ib.average_cost,(ib.quantity_on_hand*ib.average_cost) AS stock_value FROM inventory_balances ib JOIN items i ON i.id=ib.item_id JOIN warehouses w ON w.id=ib.warehouse_id LEFT JOIN item_categories ic ON ic.id=i.category_id WHERE ib.tenant_id=p_TenantId AND (p_WarehouseId IS NULL OR ib.warehouse_id=p_WarehouseId) AND (p_CategoryId IS NULL OR i.category_id=p_CategoryId) AND ib.quantity_on_hand>0;
SELECT COUNT(*) AS total_items,COALESCE(SUM(quantity_on_hand),0) AS total_quantity,COALESCE(SUM(stock_value),0) AS total_value FROM tmp;
SELECT item_code,item_name,category_name,warehouse_name,quantity_on_hand,average_cost,stock_value FROM tmp ORDER BY stock_value DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_SupplierLedgerSummary`$$
CREATE PROCEDURE `sp_Report_SupplierLedgerSummary`(IN p_TenantId CHAR(36),IN p_SupplierId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT pi.invoice_number AS ref_number,pi.invoice_date AS txn_date,'Purchase Invoice' AS txn_type,pi.total_amount AS amount,pi.status,s.name AS supplier_name FROM PurchaseInvoices pi JOIN suppliers s ON s.id=pi.supplier_id WHERE pi.tenant_id=p_TenantId AND pi.status IN ('posted','paid') AND (p_SupplierId IS NULL OR pi.supplier_id=p_SupplierId) AND (p_DateFrom IS NULL OR pi.invoice_date>=p_DateFrom) AND (pi.invoice_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_transactions,COALESCE(SUM(amount),0) AS total_amount,COUNT(DISTINCT supplier_name) AS suppliers FROM tmp;
SELECT ref_number,txn_date,txn_type,amount,status,supplier_name FROM tmp ORDER BY txn_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_Report_TrialBalance`$$
CREATE PROCEDURE `sp_Report_TrialBalance`(
    IN p_TenantId CHAR(36), IN p_AsOfDate DATE, IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_IncludeZeroBalance TINYINT, IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_AsOf DATE;
    DECLARE v_Offset INT DEFAULT 0;
    SET v_AsOf = COALESCE(p_AsOfDate, CURDATE());
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_tb;
    CREATE TEMPORARY TABLE tmp_tb AS
    SELECT a.id, a.code, a.name, a.type, a.opening_balance,
           COALESCE(SUM(CASE WHEN je.entry_date < COALESCE(p_DateFrom, v_AsOf) AND je.status='posted' THEN jel.debit ELSE 0 END), 0) AS op_debit,
           COALESCE(SUM(CASE WHEN je.entry_date < COALESCE(p_DateFrom, v_AsOf) AND je.status='posted' THEN jel.credit ELSE 0 END), 0) AS op_credit,
           COALESCE(SUM(CASE WHEN (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom) AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.debit ELSE 0 END), 0) AS period_debit,
           COALESCE(SUM(CASE WHEN (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom) AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.credit ELSE 0 END), 0) AS period_credit
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_TenantId AND a.is_active = 1
    GROUP BY a.id, a.code, a.name, a.type, a.opening_balance;

    -- Summary
    SELECT COALESCE(SUM(op_debit + period_debit), 0) AS total_debit,
           COALESCE(SUM(op_credit + period_credit), 0) AS total_credit FROM tmp_tb;

    -- Detail
    SELECT code, name, type,
           ROUND(op_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END), 2) AS opening_debit,
           ROUND(op_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END), 2) AS opening_credit,
           ROUND(period_debit, 2) AS period_debit, ROUND(period_credit, 2) AS period_credit,
           ROUND(op_debit + period_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END), 2) AS closing_debit,
           ROUND(op_credit + period_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END), 2) AS closing_credit
    FROM tmp_tb
    HAVING (p_IncludeZeroBalance = 1 OR closing_debit > 0 OR closing_credit > 0)
    ORDER BY code
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_tb
    WHERE (p_IncludeZeroBalance = 1 
       OR (op_debit + period_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END)) > 0
       OR (op_credit + period_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END)) > 0);
    DROP TEMPORARY TABLE tmp_tb;
END$$
DELIMITER ;
