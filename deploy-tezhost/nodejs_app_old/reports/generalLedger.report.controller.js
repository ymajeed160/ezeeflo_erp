'use strict';

const generalLedgerReportService = require('./generalLedger.report.service');

/**
 * Report Controller for General Ledger.
 */
class GeneralLedgerReportController {

  /**
   * GET /api/reports/general-ledger
   */
  async getReport(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { accountId, dateFrom, dateTo, journalNumber, referenceNumber, page, pageSize } = req.query;

      const result = await generalLedgerReportService.getReport({
        tenantId,
        accountId,
        dateFrom,
        dateTo,
        journalNumber,
        referenceNumber,
        page: parseInt(page || 1, 10),
        pageSize: parseInt(pageSize || 50, 10),
      });

      res.json({
        success: true,
        reportName: result.reportName,
        filters: result.filters,
        summary: result.summary,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GeneralLedgerReportController();
