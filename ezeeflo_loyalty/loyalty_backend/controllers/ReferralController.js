const referralService = require('../services/ReferralService');
const ApiResponse = require('../utils/apiResponse');

class ReferralController {
  async getAll(req, res, next) {
    try {
      const result = await referralService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
  async getById(req, res, next) {
    try { return ApiResponse.success(res, { data: await referralService.getById(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
  async generateCode(req, res, next) {
    try {
      const referral = await referralService.generateReferralCode(req.body.customerId, req.user.companyId);
      return ApiResponse.created(res, { data: referral, message: 'Referral code generated' });
    } catch (error) { next(error); }
  }
  async createReferral(req, res, next) {
    try {
      const result = await referralService.createReferral(req.body.referralCode, req.body, req.user.companyId);
      return ApiResponse.created(res, { data: result, message: 'Referral registered' });
    } catch (error) { next(error); }
  }
  async grantRewards(req, res, next) {
    try {
      const referral = await referralService.grantRewards(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: referral, message: 'Referral rewards granted' });
    } catch (error) { next(error); }
  }
  async getStats(req, res, next) {
    try {
      const stats = await referralService.getReferralStats(req.user.companyId, req.query.customerId);
      return ApiResponse.success(res, { data: stats });
    } catch (error) { next(error); }
  }
}

module.exports = new ReferralController();
