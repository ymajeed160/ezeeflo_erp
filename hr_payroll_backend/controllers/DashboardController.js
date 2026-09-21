const employeeService = require('../services/EmployeeService');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {

  /**
   * GET /api/hr/dashboard/summary
   * Returns HR dashboard summary statistics.
   */
  async getSummary(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const summary = await employeeService.getDashboardSummary(tenantId);
      return ApiResponse.success(res, {
        data: summary,
        message: 'Dashboard summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
