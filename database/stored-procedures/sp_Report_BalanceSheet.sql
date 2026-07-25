DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_BalanceSheet$$
CREATE PROCEDURE sp_Report_BalanceSheet(
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
END$$
DELIMITER ;
