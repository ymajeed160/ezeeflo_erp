DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_BankTransactionSummary$$
CREATE PROCEDURE sp_Report_BankTransactionSummary(
    IN p_TenantId CHAR(36), IN p_BankAccountId CHAR(36),
    IN p_DateFrom DATE, IN p_DateTo DATE,
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp;
    CREATE TEMPORARY TABLE tmp AS
    SELECT ba.account_name, ba.account_number,
           COUNT(bt.id) AS transaction_count,
           COALESCE(SUM(bt.debit_amount), 0) AS total_deposits,
           COALESCE(SUM(bt.credit_amount), 0) AS total_withdrawals
    FROM bank_accounts ba
    LEFT JOIN bank_transactions bt ON bt.bank_account_id = ba.id AND bt.tenant_id = p_TenantId
    WHERE ba.tenant_id = p_TenantId
      AND (p_BankAccountId IS NULL OR ba.id = p_BankAccountId)
    GROUP BY ba.id, ba.account_name, ba.account_number;

    SELECT COUNT(*) AS total_accounts,
           COALESCE(SUM(total_deposits), 0) AS total_deposits,
           COALESCE(SUM(total_withdrawals), 0) AS total_withdrawals
    FROM tmp;

    SELECT account_name, account_number, transaction_count, total_deposits, total_withdrawals
    FROM tmp ORDER BY account_name LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp;
    DROP TEMPORARY TABLE tmp;
END$$
DELIMITER ;
