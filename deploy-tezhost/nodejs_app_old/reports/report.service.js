'use strict';

const reportRepository = require('./report.repository');
const { getReportConfig } = require('./report.registry');

/**
 * Unified Report Service.
 * Routes report requests to the correct stored procedure.
 */
class ReportService {

  /**
   * Execute any registered report.
   * @param {string} reportRoute - Route name (e.g. 'general-ledger')
   * @param {object} queryParams - Query parameters from the request
   * @param {string} tenantId - Tenant UUID from auth
   * @returns {Promise<object>} Standardized report response
   */
  async executeReport(reportRoute, queryParams = {}, tenantId) {
    const config = getReportConfig(reportRoute);
    if (!config) {
      throw Object.assign(new Error(`Report '${reportRoute}' not found`), { statusCode: 404 });
    }

    // Map query params to SP params (add p_ prefix for convention)
    const dynamicParams = {};
    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null && val !== '') {
        dynamicParams[`p_${key.charAt(0).toUpperCase()}${key.slice(1)}`] = val;
      }
    }

    // Build complete parameter list using registry signature if available.
    // MySQL procedures require ALL parameters to be passed — missing ones become NULL.
    let spParams;
    if (Array.isArray(config.params) && config.params.length > 0) {
      spParams = {};
      for (const paramName of config.params) {
        if (paramName === 'p_Page') {
          spParams[paramName] = parseInt(dynamicParams[paramName] || queryParams.page || 1, 10);
        } else if (paramName === 'p_PageSize') {
          spParams[paramName] = parseInt(dynamicParams[paramName] || queryParams.pageSize || 50, 10);
        } else if (paramName in dynamicParams) {
          spParams[paramName] = dynamicParams[paramName];
        } else {
          spParams[paramName] = null; // MySQL NULL for missing optional params
        }
      }
    } else {
      // No registry signature — use whatever was provided (fallback)
      spParams = dynamicParams;
      if (!spParams.p_Page) spParams.p_Page = parseInt(queryParams.page || 1, 10);
      if (!spParams.p_PageSize) spParams.p_PageSize = parseInt(queryParams.pageSize || 50, 10);
    }

    const result = await reportRepository.executeReport(config.procedure, spParams, tenantId);

    return {
      reportName: config.title,
      route: reportRoute,
      category: config.category,
      filters: queryParams,
      summary: result.summary,
      data: result.data,
      pagination: result.pagination,
    };
  }
}

module.exports = new ReportService();
