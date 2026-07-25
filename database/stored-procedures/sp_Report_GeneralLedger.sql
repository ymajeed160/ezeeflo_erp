-- ============================================================
-- Stored Procedure: sp_Report_GeneralLedger
-- Description: Returns General Ledger entries for a given
--              account (or account hierarchy) within a date range.
--              Uses only POSTED journal entries.
--              Computes opening balance, running balance, and
--              summary totals using standard accounting formulas.
--
-- Parameters:
--   p_TenantId     CHAR(36)  - Tenant UUID (from auth context)
--   p_AccountId    CHAR(36)  - Filter by specific account (optional)
--   p_DateFrom     DATE      - Start date (optional)
--   p_DateTo       DATE      - End date (optional)
--   p_JournalNumber VARCHAR(50) - Filter by journal entry number (optional)
--   p_ReferenceNumber VARCHAR(100) - Filter by reference (optional)
--   p_Page         INT       - Page number (default 1)
--   p_PageSize     INT       - Rows per page (default 50)
--
-- Output:
--   TransactionDate, JournalNumber, ReferenceNumber, Description,
--   Debit, Credit, RunningBalance
--
-- Summary (separate result set):
--   OpeningBalance, TotalDebit, TotalCredit, ClosingBalance
--
-- Accounting formula per account type:
--   Asset/Expense:    RunningBalance = OpeningBalance + SUM(Debit) - SUM(Credit)
--   Liability/Equity/Revenue: RunningBalance = OpeningBalance - SUM(Debit) + SUM(Credit)
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Report_GeneralLedger$$

CREATE PROCEDURE sp_Report_GeneralLedger(
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
