/**
 * GeneralLedgerDTO
 *
 * Transforms raw ledger query results into the structured API response format.
 * Follows the same DTO pattern established by JournalEntryDTO.
 */

class GeneralLedgerTransactionDTO {
  /**
   * Transform a single journal entry line into a ledger transaction row.
   * @param {Object} line - Raw JournalEntryLine with included JournalEntry and Account
   * @param {number} runningBalance - Calculated running balance at this row
   * @returns {Object} Formatted transaction row
   */
  static toResponse(line, runningBalance = null) {
    if (!line) return null;
    const data = line.toJSON ? line.toJSON() : line;

    return {
      transactionDate: data.JournalEntry
        ? data.JournalEntry.entryDate
        : data.entryDate || null,
      journalNumber: data.JournalEntry
        ? data.JournalEntry.entryNumber
        : data.entryNumber || null,
      referenceNumber: data.JournalEntry
        ? data.JournalEntry.reference || null
        : data.reference || null,
      description: data.description || (data.JournalEntry ? data.JournalEntry.description : null) || null,
      debit: parseFloat(data.debit || 0),
      credit: parseFloat(data.credit || 0),
      runningBalance: runningBalance !== null ? parseFloat(runningBalance.toFixed(2)) : null,
      accountCode: data.account ? data.account.code : null,
      accountName: data.account ? data.account.name : null,
      accountType: data.account ? data.account.type : null,
    };
  }

  static toListResponse(lines, runningBalances = []) {
    if (!lines) return [];
    return lines.map((line, index) =>
      GeneralLedgerTransactionDTO.toResponse(
        line,
        runningBalances[index] !== undefined ? runningBalances[index] : null
      )
    );
  }
}

class GeneralLedgerDTO {
  /**
   * Build the full General Ledger API response.
   *
   * @param {Object} params
   * @param {Object} params.account - The account being viewed
   * @param {number} params.openingBalance - Computed opening balance
   * @param {number} params.totalDebit - Sum of debits in the period
   * @param {number} params.totalCredit - Sum of credits in the period
   * @param {number} params.closingBalance - Computed closing balance
   * @param {Array}  params.transactions - Mapped transaction rows (with running balances)
   * @param {Object} params.pagination - Pagination metadata
   * @returns {Object} Structured ledger response
   */
  static toResponse({
    account,
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance,
    transactions,
    pagination,
  }) {
    return {
      account: account
        ? {
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            parentAccountId: account.parentAccountId || null,
          }
        : null,
      openingBalance: parseFloat((openingBalance || 0).toFixed(2)),
      totalDebit: parseFloat((totalDebit || 0).toFixed(2)),
      totalCredit: parseFloat((totalCredit || 0).toFixed(2)),
      closingBalance: parseFloat((closingBalance || 0).toFixed(2)),
      transactions: transactions || [],
      pagination: pagination || null,
    };
  }
}

module.exports = { GeneralLedgerDTO, GeneralLedgerTransactionDTO };