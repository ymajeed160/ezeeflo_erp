'use strict';

const reportService = require('./report.service');

/**
 * Unified Report Controller.
 * Single endpoint that handles all reports by route name.
 */
class ReportController {

  /**
   * GET /api/reports/:reportName
   */
  async executeReport(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { reportName } = req.params;
      const queryParams = { ...req.query };
      delete queryParams.page;
      delete queryParams.pageSize;

      const result = await reportService.executeReport(reportName, {
        ...queryParams,
        page: req.query.page,
        pageSize: req.query.pageSize,
      }, tenantId);

      res.json({
        success: true,
        reportName: result.reportName,
        route: result.route,
        category: result.category,
        filters: result.filters,
        summary: result.summary,
        data: result.data,
        pagination: result.pagination,
        assets: result.assets || [],
        liabilitiesEquity: result.liabilitiesEquity || [],
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
