'use strict';

const { executeReportProcedure } = require('./spExecutor');

/**
 * Report Repository for General Ledger.
 * Executes the sp_Report_GeneralLedger stored procedure.
 */
class GeneralLedgerReportRepository {

  /**
   * Execute the General Ledger report.
   * @param {object} params
   * @param {string} params.tenantId - Tenant UUID
   * @param {string} params.accountId - Account UUID (optional)
   * @param {string} params.dateFrom - Start date (optional)
   * @param {string} params.dateTo - End date (optional)
   * @param {string} params.journalNumber - Journal entry number filter (optional)
   * @param {string} params.referenceNumber - Reference filter (optional)
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Page size
   * @returns {Promise<{summary: object, data: Array, pagination: object}>}
   */
  async getGeneralLedger({ tenantId, accountId, dateFrom, dateTo, journalNumber, referenceNumber, page = 1, pageSize = 50 }) {
    const results = await executeReportProcedure('sp_Report_GeneralLedger', {
      p_AccountId: accountId || null,
      p_DateFrom: dateFrom || null,
      p_DateTo: dateTo || null,
      p_JournalNumber: journalNumber || null,
      p_ReferenceNumber: referenceNumber || null,
      p_Page: parseInt(page, 10),
      p_PageSize: parseInt(pageSize, 10),
    }, { tenantId });

    // MySQL CALL returns multiple result sets: [summary[], transactions[], pagination[]]
    const summary = Array.isArray(results[0]) && results[0].length > 0 ? results[0][0] : {};
    const data = Array.isArray(results[1]) ? results[1] : [];
    const paginationRow = Array.isArray(results[2]) && results[2].length > 0 ? results[2][0] : {};

    return {
      summary: {
        openingBalance: parseFloat(summary.opening_balance || 0),
        totalDebit: parseFloat(summary.total_debit || 0),
        totalCredit: parseFloat(summary.total_credit || 0),
        closingBalance: parseFloat(summary.closing_balance || 0),
        accountType: summary.account_type || '',
      },
      data: data.map((r) => ({
        transactionDate: r.transaction_date,
        journalNumber: r.journal_number,
        referenceNumber: r.reference_number,
        description: r.description,
        debit: parseFloat(r.debit || 0),
        credit: parseFloat(r.credit || 0),
        runningBalance: parseFloat(r.running_balance || 0),
      })),
      pagination: {
        page: parseInt(paginationRow.page || page, 10),
        pageSize: parseInt(paginationRow.page_size || pageSize, 10),
        totalRecords: parseInt(paginationRow.total_records || 0, 10),
        totalPages: parseInt(paginationRow.total_pages || 0, 10),
      },
    };
  }
}

module.exports = new GeneralLedgerReportRepository();
