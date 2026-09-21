const reportsService = require('../services/ReportsService');
const ApiResponse = require('../utils/apiResponse');

class ReportsController {
  async customerLedger(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.customerLedger(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async pointsExpiry(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.pointsExpiry(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async redeemedRewards(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.redeemedRewards(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async campaignPerformance(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.campaignPerformance(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async topCustomers(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.topCustomers(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async inactiveCustomers(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.inactiveCustomers(req.user.companyId, req.query) }); } catch(e) { next(e); } }
  async membershipReport(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.membershipReport(req.user.companyId) }); } catch(e) { next(e); } }
  async revenueImpact(req, res, next) { try { return ApiResponse.success(res, { data: await reportsService.revenueImpact(req.user.companyId, req.query) }); } catch(e) { next(e); } }
}

module.exports = new ReportsController();
