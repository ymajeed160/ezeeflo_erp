DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Report_BalanceSheet_v2$$

CREATE PROCEDURE sp_Report_BalanceSheet_v2(
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
END$$

DELIMITER ;
