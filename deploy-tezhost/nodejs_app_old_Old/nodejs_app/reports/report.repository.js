'use strict';

const { executeReportProcedure } = require('./spExecutor');

/**
 * Generic Report Repository.
 * Executes any registered stored procedure by name with given parameters.
 */
class ReportRepository {

  /**
   * Execute a report stored procedure.
   * @param {string} procedureName - The SP name (must be in allowlist)
   * @param {object} params - Flat key-value parameters for the SP
   * @param {string} tenantId - Tenant UUID (from auth context)
   * @returns {Promise<{summary: object|null, data: Array, pagination: object}>}
   */
  async executeReport(procedureName, params = {}, tenantId) {
    const results = await executeReportProcedure(procedureName, params, { tenantId });

    // Balance Sheet v2: returns [summary, assets, liabilitiesEquity]
    if (procedureName === 'sp_Report_BalanceSheet_v2') {
      const summary = Array.isArray(results[0]) && results[0].length > 0 ? results[0][0] : null;
      const assets = Array.isArray(results[1]) ? results[1].map((r) => this._parseNumeric(r)) : [];
      const liabilitiesEquity = Array.isArray(results[2]) ? results[2].map((r) => this._parseNumeric(r)) : [];
      return {
        summary: summary ? this._parseNumeric(summary) : null,
        assets,
        liabilitiesEquity,
        pagination: null,
        isStructured: true,
      };
    }

    // MySQL CALL returns multiple result sets
    // Convention: result[0] = summary, result[1] = data, result[2] = pagination
    const summary = Array.isArray(results[0]) && results[0].length > 0 ? results[0][0] : null;
    const data = Array.isArray(results[1]) ? results[1] : (Array.isArray(results[0]) ? results[0] : []);
    const paginationRow = Array.isArray(results[2]) && results[2].length > 0 ? results[2][0] :
                          (Array.isArray(results[1]) ? null : null);

    return {
      summary: summary ? this._parseNumeric(summary) : null,
      data: data.map((r) => this._parseNumeric(r)),
      pagination: paginationRow
        ? {
            page: parseInt(paginationRow.page || paginationRow.p_page || 1, 10),
            pageSize: parseInt(paginationRow.page_size || paginationRow.p_pageSize || 50, 10),
            totalRecords: parseInt(paginationRow.total_records || paginationRow.total || 0, 10),
            totalPages: parseInt(paginationRow.total_pages || 0, 10),
          }
        : { page: 1, pageSize: 50, totalRecords: data.length, totalPages: 1 },
      isStructured: false,
    };
  }

  /** Convert all numeric string values to floats */
  _parseNumeric(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && /^-?\d+\.?\d*$/.test(val) && !isNaN(parseFloat(val))) {
        result[key] = parseFloat(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
}

module.exports = new ReportRepository();
