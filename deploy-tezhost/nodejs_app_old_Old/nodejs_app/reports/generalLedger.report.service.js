'use strict';

const generalLedgerReportRepository = require('./generalLedger.report.repository');

/**
 * Report Service for General Ledger.
 * Delegates to the report repository which executes the stored procedure.
 */
class GeneralLedgerReportService {

  /**
   * Get General Ledger report data.
   * @param {object} params - See GeneralLedgerReportRepository.getGeneralLedger
   * @returns {Promise<object>} Standardized report response
   */
  async getReport(params) {
    const result = await generalLedgerReportRepository.getGeneralLedger(params);

    return {
      reportName: 'General Ledger',
      filters: {
        accountId: params.accountId || null,
        dateFrom: params.dateFrom || null,
        dateTo: params.dateTo || null,
        journalNumber: params.journalNumber || null,
        referenceNumber: params.referenceNumber || null,
      },
      summary: result.summary,
      data: result.data,
      pagination: result.pagination,
    };
  }
}

module.exports = new GeneralLedgerReportService();
