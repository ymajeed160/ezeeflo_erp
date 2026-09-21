DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_ProfitAndLoss$$
CREATE PROCEDURE sp_Report_ProfitAndLoss(
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
