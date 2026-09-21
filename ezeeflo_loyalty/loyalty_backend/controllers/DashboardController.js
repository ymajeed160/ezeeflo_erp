const dashboardService = require('../services/DashboardService');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats(req.user.companyId);
      return ApiResponse.success(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
