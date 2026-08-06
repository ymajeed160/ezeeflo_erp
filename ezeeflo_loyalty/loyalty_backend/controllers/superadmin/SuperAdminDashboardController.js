const authService = require('../../services/AuthService');
const dashboardService = require('../../services/DashboardService');
const ApiResponse = require('../../utils/apiResponse');

class SuperAdminDashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getSuperAdminStats();
      return ApiResponse.success(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminDashboardController();
