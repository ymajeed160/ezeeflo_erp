const analyticsService = require('../services/AnalyticsService');
const ApiResponse = require('../utils/apiResponse');

class AnalyticsController {
  async dashboard(req, res, next) { try { return ApiResponse.success(res, { data: await analyticsService.getDashboard(req.user.companyId) }); } catch(e) { next(e); } }
  async monthlyTrends(req, res, next) { try { return ApiResponse.success(res, { data: await analyticsService.getMonthlyTrends(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async topCampaigns(req, res, next) { try { return ApiResponse.success(res, { data: await analyticsService.getTopCampaigns(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async customerGrowth(req, res, next) { try { return ApiResponse.success(res, { data: await analyticsService.getCustomerGrowth(req.user.companyId, req.query) }); } catch(e) { next(e); } }
}

module.exports = new AnalyticsController();
