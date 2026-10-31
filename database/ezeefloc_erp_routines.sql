-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: ezeefloc_erp
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping routines for database 'ezeefloc_erp'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_AccountsPayable` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_AccountsPayable`(

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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_AccountsReceivable` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_AccountsReceivable`(

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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_BalanceSheet` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_BalanceSheet`(

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



    DROP TEMPORARY TABLE IF EXISTS tmp_bs;

    CREATE TEMPORARY TABLE tmp_bs AS

    SELECT a.id, a.code, a.name, a.type, a.opening_balance,

           COALESCE(SUM(CASE WHEN je.entry_date < COALESCE(p_DateFrom, v_AsOf) AND je.status='posted' THEN jel.debit ELSE 0 END), 0) AS op_debit,

           COALESCE(SUM(CASE WHEN je.entry_date < COALESCE(p_DateFrom, v_AsOf) AND je.status='posted' THEN jel.credit ELSE 0 END), 0) AS op_credit,

           COALESCE(SUM(CASE WHEN (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom) AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.debit ELSE 0 END), 0) AS period_debit,

           COALESCE(SUM(CASE WHEN (p_DateFrom IS NULL OR je.entry_date >= p_DateFrom) AND je.entry_date <= v_AsOf AND je.status='posted' THEN jel.credit ELSE 0 END), 0) AS period_credit

    FROM accounts a

    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id

    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.tenant_id = a.tenant_id

    WHERE a.tenant_id = p_TenantId AND a.is_active = 1

      AND a.type IN ('asset', 'liability', 'equity')

    GROUP BY a.id, a.code, a.name, a.type, a.opening_balance;



    -- Summary

    SELECT COALESCE(SUM(op_debit + period_debit), 0) AS total_debit,

           COALESCE(SUM(op_credit + period_credit), 0) AS total_credit FROM tmp_bs;



    -- Detail

    SELECT code, name, type,

           ROUND(op_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END), 2) AS opening_debit,

           ROUND(op_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END), 2) AS opening_credit,

           ROUND(period_debit, 2) AS period_debit, ROUND(period_credit, 2) AS period_credit,

           ROUND(op_debit + period_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END), 2) AS closing_debit,

           ROUND(op_credit + period_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END), 2) AS closing_credit

    FROM tmp_bs

    HAVING (p_IncludeZeroBalance = 1 OR closing_debit > 0 OR closing_credit > 0)

    ORDER BY type, code

    LIMIT p_PageSize OFFSET v_Offset;



    SELECT COUNT(*) AS total FROM tmp_bs

    WHERE (p_IncludeZeroBalance = 1 

       OR (op_debit + period_debit + (CASE WHEN type IN ('asset','expense') THEN opening_balance ELSE 0 END)) > 0

       OR (op_credit + period_credit + (CASE WHEN type IN ('liability','equity','revenue') THEN opening_balance ELSE 0 END)) > 0);

    DROP TEMPORARY TABLE tmp_bs;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_BalanceSheet_v2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_BalanceSheet_v2`(
    IN p_TenantId CHAR(36),
    IN p_AsOfDate DATE
)
BEGIN
    DECLARE v_AsOf DATE;
    DECLARE v_NetProfitLoss DECIMAL(18,2) DEFAULT 0;
    
    SET v_AsOf = COALESCE(p_AsOfDate, CURDATE());

    DROP TEMPORARY TABLE IF EXISTS tmp_balances;
    CREATE TEMPORARY TABLE tmp_balances (
        id CHAR(36), code VARCHAR(50), name VARCHAR(200), type VARCHAR(20),
        parent_account_id CHAR(36), opening_balance DECIMAL(18,2),
        total_debit DECIMAL(18,2), total_credit DECIMAL(18,2),
        INDEX idx_type (type), INDEX idx_parent (parent_account_id)
    ) AS
    SELECT a.id, a.code, a.name, a.type, a.parent_account_id, a.opening_balance,
        COALESCE(SUM(CASE WHEN je.entry_date <= v_AsOf AND je.status='posted' THEN jel.debit ELSE 0 END),0) AS total_debit,
        COALESCE(SUM(CASE WHEN je.entry_date <= v_AsOf AND je.status='posted' THEN jel.credit ELSE 0 END),0) AS total_credit
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.tenant_id = a.tenant_id
    WHERE a.tenant_id = p_TenantId AND a.is_active = 1
    GROUP BY a.id, a.code, a.name, a.type, a.parent_account_id, a.opening_balance;

    -- Net Profit/Loss
    SELECT COALESCE(SUM(
        CASE WHEN b.type='revenue' THEN b.opening_balance + b.total_credit - b.total_debit
             WHEN b.type='expense' THEN -(b.opening_balance + b.total_debit - b.total_credit)
             ELSE 0 END), 0) INTO v_NetProfitLoss
    FROM tmp_balances b WHERE b.type IN ('revenue','expense');

    -- Classified results
    DROP TEMPORARY TABLE IF EXISTS tmp_classified;
    CREATE TEMPORARY TABLE tmp_classified (
        section VARCHAR(20), section_group VARCHAR(50),
        account_code VARCHAR(50), account_name VARCHAR(200),
        balance DECIMAL(18,2), display_order INT, is_parent TINYINT DEFAULT 0
    );

    -- Parent headers
    INSERT INTO tmp_classified (section, section_group, account_code, account_name, balance, display_order, is_parent)
    SELECT 
        CASE WHEN p.type='asset' THEN 'ASSETS' WHEN p.type='liability' THEN 'LIABILITIES' ELSE 'EQUITY' END,
        CASE WHEN p.type='asset' AND (p.name LIKE '%current%' OR p.code BETWEEN '1000' AND '1399') THEN 'CURRENT_ASSETS'
             WHEN p.type='asset' THEN 'NON_CURRENT_ASSETS'
             WHEN p.type='liability' AND (p.name LIKE '%current%' OR p.code BETWEEN '2000' AND '2399') THEN 'CURRENT_LIABILITIES'
             WHEN p.type='liability' THEN 'NON_CURRENT_LIABILITIES'
             ELSE 'EQUITY' END,
        p.code, p.name,
        COALESCE((SELECT SUM(CASE WHEN c.type IN ('asset','expense') THEN c.opening_balance+c.total_debit-c.total_credit
                                   ELSE c.opening_balance+c.total_credit-c.total_debit END)
                  FROM tmp_balances c WHERE c.parent_account_id=p.id), 0),
        (@rn := @rn + 1) * 100, 1
    FROM accounts p, (SELECT @rn := 0) r
    WHERE p.tenant_id=p_TenantId AND p.is_active=1 AND p.type IN ('asset','liability','equity')
      AND p.parent_account_id IS NULL
      AND EXISTS (SELECT 1 FROM accounts c WHERE c.parent_account_id=p.id AND c.is_active=1)
    ORDER BY p.type, p.code;

    -- Leaf accounts: classify by parent hierarchy first, then code ranges
    INSERT INTO tmp_classified (section, section_group, account_code, account_name, balance, display_order, is_parent)
    SELECT 
        CASE WHEN b.type='asset' THEN 'ASSETS' WHEN b.type='liability' THEN 'LIABILITIES' ELSE 'EQUITY' END,
        CASE 
            -- Asset classification: parent name > account name > code range
            WHEN b.type='asset' AND (COALESCE(p.name,'') LIKE '%non-current%' OR COALESCE(p.name,'') LIKE '%fixed%' 
                  OR COALESCE(p.name,'') LIKE '%long-term%') THEN 'NON_CURRENT_ASSETS'
            WHEN b.type='asset' AND (COALESCE(p.name,'') LIKE '%current%') THEN 'CURRENT_ASSETS'
            WHEN b.type='asset' AND (b.name LIKE '%accumulated%' OR b.name LIKE '%fixed%' OR b.name LIKE '%equipment%' 
                  OR b.name LIKE '%property%' OR b.name LIKE '%vehicle%' OR b.name LIKE '%depreciation%') THEN 'NON_CURRENT_ASSETS'
            WHEN b.type='asset' AND b.code BETWEEN '1000' AND '1399' THEN 'CURRENT_ASSETS'
            WHEN b.type='asset' THEN 'NON_CURRENT_ASSETS'
            -- Liability classification
            WHEN b.type='liability' AND (COALESCE(p.name,'') LIKE '%non-current%' OR COALESCE(p.name,'') LIKE '%long-term%') THEN 'NON_CURRENT_LIABILITIES'
            WHEN b.type='liability' AND (COALESCE(p.name,'') LIKE '%current%') THEN 'CURRENT_LIABILITIES'
            WHEN b.type='liability' AND (b.name LIKE '%long-term%' OR b.name LIKE '%loan%') THEN 'NON_CURRENT_LIABILITIES'
            WHEN b.type='liability' AND b.code BETWEEN '2000' AND '2399' THEN 'CURRENT_LIABILITIES'
            WHEN b.type='liability' THEN 'NON_CURRENT_LIABILITIES'
            ELSE 'EQUITY' END,
        b.code, b.name,
        CASE WHEN b.type IN ('asset','expense') THEN b.opening_balance+b.total_debit-b.total_credit
             ELSE b.opening_balance+b.total_credit-b.total_debit END,
        1000 + (@rn2 := @rn2 + 1), 0
    FROM tmp_balances b
    LEFT JOIN accounts p ON p.id=b.parent_account_id, (SELECT @rn2 := 0) r2
    WHERE b.type IN ('asset','liability','equity') AND b.parent_account_id IS NOT NULL
    ORDER BY b.type, b.code;

    -- Unclassified accounts (no parent)
    -- Materialize excluded IDs first to avoid "Can't reopen table" error
    DROP TEMPORARY TABLE IF EXISTS tmp_exclude;
    CREATE TEMPORARY TABLE tmp_exclude (ex_id CHAR(36) PRIMARY KEY);
    INSERT IGNORE INTO tmp_exclude (ex_id)
    SELECT DISTINCT c.id FROM tmp_balances c WHERE c.parent_account_id IS NOT NULL AND c.id IS NOT NULL;
    INSERT IGNORE INTO tmp_exclude (ex_id)
    SELECT DISTINCT a.id FROM accounts a WHERE a.is_active=1 AND a.parent_account_id IS NULL
                   AND EXISTS (SELECT 1 FROM accounts ch WHERE ch.parent_account_id=a.id AND ch.is_active=1)
                   AND a.id IS NOT NULL;

    INSERT INTO tmp_classified (section, section_group, account_code, account_name, balance, display_order, is_parent)
    SELECT 
        CASE WHEN b.type='asset' THEN 'ASSETS' WHEN b.type='liability' THEN 'LIABILITIES' ELSE 'EQUITY' END,
        CASE 
            WHEN b.type='asset' AND (b.name LIKE '%accumulated%' OR b.name LIKE '%fixed%' OR b.name LIKE '%equipment%' 
                  OR b.name LIKE '%property%' OR b.name LIKE '%vehicle%' OR b.name LIKE '%depreciation%') THEN 'NON_CURRENT_ASSETS'
            WHEN b.type='asset' AND b.code BETWEEN '1000' AND '1399' THEN 'CURRENT_ASSETS'
            WHEN b.type='asset' THEN 'NON_CURRENT_ASSETS'
            WHEN b.type='liability' AND (b.name LIKE '%long-term%' OR b.name LIKE '%loan%') THEN 'NON_CURRENT_LIABILITIES'
            WHEN b.type='liability' AND b.code BETWEEN '2000' AND '2399' THEN 'CURRENT_LIABILITIES'
            WHEN b.type='liability' THEN 'NON_CURRENT_LIABILITIES'
            ELSE 'EQUITY' END,
        b.code, b.name,
        CASE WHEN b.type IN ('asset','expense') THEN b.opening_balance+b.total_debit-b.total_credit
             ELSE b.opening_balance+b.total_credit-b.total_debit END,
        2000 + (@rn3 := @rn3 + 1), 0
    FROM tmp_balances b, (SELECT @rn3 := 0) r3
    WHERE b.type IN ('asset','liability','equity')
      AND b.id NOT IN (SELECT ex_id FROM tmp_exclude)
    ORDER BY b.type, b.code;

    DROP TEMPORARY TABLE IF EXISTS tmp_exclude;

    -- Totals
    DROP TEMPORARY TABLE IF EXISTS tmp_totals;
    CREATE TEMPORARY TABLE tmp_totals (
        total_current_assets DECIMAL(18,2) DEFAULT 0,
        total_non_current_assets DECIMAL(18,2) DEFAULT 0,
        total_assets DECIMAL(18,2) DEFAULT 0,
        total_current_liabilities DECIMAL(18,2) DEFAULT 0,
        total_non_current_liabilities DECIMAL(18,2) DEFAULT 0,
        total_liabilities DECIMAL(18,2) DEFAULT 0,
        total_equity DECIMAL(18,2) DEFAULT 0,
        net_profit_loss DECIMAL(18,2) DEFAULT 0,
        total_liabilities_equity DECIMAL(18,2) DEFAULT 0,
        difference DECIMAL(18,2) DEFAULT 0,
        is_balanced TINYINT DEFAULT 0
    );

    INSERT INTO tmp_totals (total_current_assets, total_non_current_assets,
        total_current_liabilities, total_non_current_liabilities, total_equity, net_profit_loss)
    SELECT 
        COALESCE(SUM(CASE WHEN section_group='CURRENT_ASSETS' AND is_parent=0 THEN balance ELSE 0 END),0),
        COALESCE(SUM(CASE WHEN section_group='NON_CURRENT_ASSETS' AND is_parent=0 THEN balance ELSE 0 END),0),
        COALESCE(SUM(CASE WHEN section_group='CURRENT_LIABILITIES' AND is_parent=0 THEN balance ELSE 0 END),0),
        COALESCE(SUM(CASE WHEN section_group='NON_CURRENT_LIABILITIES' AND is_parent=0 THEN balance ELSE 0 END),0),
        COALESCE(SUM(CASE WHEN section_group='EQUITY' AND is_parent=0 THEN balance ELSE 0 END),0),
        v_NetProfitLoss
    FROM tmp_classified;

    UPDATE tmp_totals SET 
        total_assets = total_current_assets + total_non_current_assets,
        total_liabilities = total_current_liabilities + total_non_current_liabilities,
        total_liabilities_equity = total_current_liabilities + total_non_current_liabilities + total_equity + net_profit_loss,
        difference = (total_current_assets + total_non_current_assets) 
                   - (total_current_liabilities + total_non_current_liabilities + total_equity + net_profit_loss);

    UPDATE tmp_totals SET is_balanced = CASE WHEN ABS(difference) < 0.01 THEN 1 ELSE 0 END;

    -- RESULT 1: Summary
    SELECT * FROM tmp_totals;

    -- RESULT 2: Assets (left side)
    SELECT section, section_group, account_code, account_name, balance, display_order, is_parent
    FROM tmp_classified WHERE section='ASSETS' ORDER BY display_order;

    -- RESULT 3: Liabilities & Equity (right side)
    SELECT section, section_group, account_code, account_name, balance, display_order, is_parent
    FROM tmp_classified WHERE section IN ('LIABILITIES','EQUITY') ORDER BY display_order;

    DROP TEMPORARY TABLE IF EXISTS tmp_balances;
    DROP TEMPORARY TABLE IF EXISTS tmp_classified;
    DROP TEMPORARY TABLE IF EXISTS tmp_totals;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_BankAccountLedger` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_BankAccountLedger`(
    IN p_TenantId CHAR(36),
    IN p_BankAccountId CHAR(36),
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
      bt.transaction_number,
      bt.transaction_date,
      bt.transaction_type,
      bt.description,
      bt.debit_amount,
      bt.credit_amount,
      bt.status,
      ba.account_name,
      ba.account_number
    FROM bank_transactions bt
    JOIN bank_accounts ba ON ba.id = bt.bank_account_id
    WHERE bt.tenant_id = p_TenantId
      AND (p_BankAccountId IS NULL OR bt.bank_account_id = p_BankAccountId)
      AND (p_DateFrom IS NULL OR bt.transaction_date >= p_DateFrom)
      AND (bt.transaction_date <= p_DateTo OR p_DateTo IS NULL);
    
    SELECT 
      COUNT(*) AS total_transactions,
      COALESCE(SUM(debit_amount), 0) AS total_debit,
      COALESCE(SUM(credit_amount), 0) AS total_credit
    FROM tmp;
    
    SELECT 
      transaction_number,
      transaction_date,
      transaction_type,
      description,
      debit_amount,
      credit_amount,
      status,
      account_name
    FROM tmp
    ORDER BY transaction_date DESC
    LIMIT p_PageSize OFFSET v_Offset;
    
    SELECT COUNT(*) AS total FROM tmp;
    
    DROP TEMPORARY TABLE tmp;
  END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_BankReconciliationSummary` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_BankReconciliationSummary`(
      IN p_TenantId CHAR(36),
      IN p_BankAccountId CHAR(36),
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
        br.reconciliation_number,
        br.reconciled_at AS reconciliation_date,
        br.status,
        COALESCE(br.system_closing_balance, 0) AS closing_balance,
        COALESCE(br.statement_closing_balance, 0) AS statement_balance,
        ba.account_name,
        ba.account_number
      FROM bank_reconciliations br
      JOIN bank_accounts ba ON ba.id = br.bank_account_id
      WHERE br.tenant_id = p_TenantId
        AND (p_BankAccountId IS NULL OR br.bank_account_id = p_BankAccountId)
        AND (p_DateFrom IS NULL OR br.reconciled_at >= p_DateFrom)
        AND (br.reconciled_at <= p_DateTo OR p_DateTo IS NULL);
      
      SELECT 
        COUNT(*) AS total_reconciliations,
        COALESCE(SUM(closing_balance), 0) AS total_closing_balance,
        COALESCE(SUM(statement_balance), 0) AS total_statement_balance
      FROM tmp;
      
      SELECT 
        reconciliation_number,
        reconciliation_date,
        status,
        account_name,
        closing_balance,
        statement_balance
      FROM tmp
      ORDER BY reconciliation_date DESC
      LIMIT p_PageSize OFFSET v_Offset;
      
      SELECT COUNT(*) AS total FROM tmp;
      
      DROP TEMPORARY TABLE tmp;
    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_BankTransactionSummary` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_BankTransactionSummary`(IN p_TenantId CHAR(36),IN p_BankAccountId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT ba.account_name,ba.account_number,COUNT(bt.id) AS transaction_count,COALESCE(SUM(bt.debit_amount),0) AS total_deposits,COALESCE(SUM(bt.credit_amount),0) AS total_withdrawals FROM BankAccounts ba LEFT JOIN BankTransactions bt ON bt.bank_account_id=ba.id AND bt.tenant_id=p_TenantId WHERE ba.tenant_id=p_TenantId AND (p_BankAccountId IS NULL OR ba.id=p_BankAccountId) GROUP BY ba.id,ba.account_name,ba.account_number;
SELECT COUNT(*) AS total_accounts,COALESCE(SUM(total_deposits),0) AS total_deposits,COALESCE(SUM(total_withdrawals),0) AS total_withdrawals FROM tmp;
SELECT account_name,account_number,transaction_count,total_deposits,total_withdrawals FROM tmp ORDER BY account_name LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_CashFlow` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_CashFlow`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT je.entry_number,je.entry_date,je.description,COALESCE((SELECT SUM(debit) FROM journal_entry_lines WHERE journal_entry_id=je.id),0) AS total_debit,COALESCE((SELECT SUM(credit) FROM journal_entry_lines WHERE journal_entry_id=je.id),0) AS total_credit FROM journal_entries je WHERE je.tenant_id=p_TenantId AND je.status='posted' AND (p_DateFrom IS NULL OR je.entry_date>=p_DateFrom) AND (je.entry_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_entries,COALESCE(SUM(total_debit),0) AS total_inflow,COALESCE(SUM(total_credit),0) AS total_outflow,COALESCE(SUM(total_debit),0)-COALESCE(SUM(total_credit),0) AS net_cash_flow FROM tmp;
SELECT entry_number,entry_date,description,total_debit,total_credit FROM tmp ORDER BY entry_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_CustomerCreditBalance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_CustomerCreditBalance`(IN p_TenantId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT c.name,c.email,COALESCE((SELECT SUM(grand_total) FROM sales_invoices WHERE customer_id=c.id AND tenant_id=p_TenantId AND status IN ('posted','partially_paid')),0) AS total_invoiced,COALESCE((SELECT SUM(amount) FROM customer_payments WHERE customer_id=c.id AND tenant_id=p_TenantId AND status='posted'),0) AS total_paid,COALESCE((SELECT SUM(grand_total) FROM sales_invoices WHERE customer_id=c.id AND tenant_id=p_TenantId AND status IN ('posted','partially_paid')),0)-COALESCE((SELECT SUM(amount) FROM customer_payments WHERE customer_id=c.id AND tenant_id=p_TenantId AND status='posted'),0) AS balance FROM customers c WHERE c.tenant_id=p_TenantId AND c.status='active' HAVING balance>0;
SELECT COUNT(*) AS total_customers,COALESCE(SUM(balance),0) AS total_outstanding FROM tmp;
SELECT name,email,total_invoiced,total_paid,balance FROM tmp ORDER BY balance DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_CustomerLedgerSummary` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_CustomerLedgerSummary`(IN p_TenantId CHAR(36),IN p_CustomerId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT si.invoice_number AS ref_number,si.invoice_date AS txn_date,'Sales Invoice' AS txn_type,si.grand_total AS amount,si.status,c.name AS customer_name FROM sales_invoices si JOIN customers c ON c.id=si.customer_id WHERE si.tenant_id=p_TenantId AND si.status IN ('posted','paid','partially_paid') AND (p_CustomerId IS NULL OR si.customer_id=p_CustomerId) AND (p_DateFrom IS NULL OR si.invoice_date>=p_DateFrom) AND (si.invoice_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_transactions,COALESCE(SUM(amount),0) AS total_amount,COUNT(DISTINCT customer_name) AS customers FROM tmp;
SELECT ref_number,txn_date,txn_type,amount,status,customer_name FROM tmp ORDER BY txn_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_DeliveredItemsToBeBilled` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_DeliveredItemsToBeBilled`(IN p_TenantId CHAR(36),IN p_DateFrom DATE,IN p_DateTo DATE,IN p_CustomerId CHAR(36),IN p_Page INT,IN p_PageSize INT)
BEGIN DECLARE v_Offset INT DEFAULT 0;IF p_Page IS NULL OR p_Page<1 THEN SET p_Page=1;END IF;IF p_PageSize IS NULL OR p_PageSize<1 THEN SET p_PageSize=50;END IF;SET v_Offset=(p_Page-1)*p_PageSize;
DROP TEMPORARY TABLE IF EXISTS tmp;CREATE TEMPORARY TABLE tmp AS SELECT dn.delivery_number,dn.delivery_date,dn.total_amount,c.name AS customer_name FROM delivery_notes dn LEFT JOIN customers c ON c.id=dn.customer_id WHERE dn.tenant_id=p_TenantId AND dn.status='delivered' AND NOT EXISTS(SELECT 1 FROM sales_invoices si WHERE si.tenant_id=p_TenantId AND si.delivery_note_id=dn.id) AND (p_DateFrom IS NULL OR dn.delivery_date>=p_DateFrom) AND (dn.delivery_date<=p_DateTo OR p_DateTo IS NULL);
SELECT COUNT(*) AS total_dn,COALESCE(SUM(total_amount),0) AS total_unbilled FROM tmp;
SELECT delivery_number,delivery_date,customer_name,total_amount FROM tmp ORDER BY delivery_date DESC LIMIT p_PageSize OFFSET v_Offset;
SELECT COUNT(*) AS total FROM tmp;DROP TEMPORARY TABLE tmp;END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_Report_DeliveryNoteTrends` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_Report_DeliveryNoteTrends`(

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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27 19:25:29

