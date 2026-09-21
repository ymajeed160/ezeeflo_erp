const membershipService = require('../services/MembershipService');
const ApiResponse = require('../utils/apiResponse');

class MembershipController {
  // Tiers CRUD
  async getAllTiers(req, res, next) {
    try {
      const result = await membershipService.getAllTiers(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getTierById(req, res, next) {
    try {
      const tier = await membershipService.getTierById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: tier });
    } catch (error) { next(error); }
  }

  async createTier(req, res, next) {
    try {
      const tier = await membershipService.createTier(req.body, req.user.companyId);
      return ApiResponse.created(res, { data: tier, message: 'Membership tier created' });
    } catch (error) { next(error); }
  }

  async updateTier(req, res, next) {
    try {
      const tier = await membershipService.updateTier(req.params.id, req.body, req.user.companyId);
      return ApiResponse.success(res, { data: tier, message: 'Tier updated' });
    } catch (error) { next(error); }
  }

  async deleteTier(req, res, next) {
    try {
      await membershipService.deleteTier(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Tier deleted' });
    } catch (error) { next(error); }
  }

  async toggleTierStatus(req, res, next) {
    try {
      const tier = await membershipService.toggleTierStatus(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: tier, message: `Tier ${tier.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
  }

  // Customer Membership
  async evaluateTier(req, res, next) {
    try {
      const result = await membershipService.evaluateCustomerTier(req.params.customerId, req.user.companyId);
      return ApiResponse.success(res, { data: result, message: result.changed ? `Tier ${result.action} to ${result.to}` : result.reason });
    } catch (error) { next(error); }
  }

  async assignTier(req, res, next) {
    try {
      const result = await membershipService.assignCustomerTier(
        req.params.customerId, req.body.tierId, req.user.companyId, req.body.notes
      );
      return ApiResponse.success(res, { data: result, message: 'Tier assigned successfully' });
    } catch (error) { next(error); }
  }

  async getCustomerHistory(req, res, next) {
    try {
      const history = await membershipService.getCustomerMembershipHistory(req.params.customerId, req.user.companyId);
      return ApiResponse.success(res, { data: history });
    } catch (error) { next(error); }
  }

  async getTierStats(req, res, next) {
    try {
      const stats = await membershipService.getTierStats(req.user.companyId);
      return ApiResponse.success(res, { data: stats });
    } catch (error) { next(error); }
  }

  async batchEvaluateTiers(req, res, next) {
    try {
      const result = await membershipService.batchEvaluateTiers(req.user.companyId);
      return ApiResponse.success(res, { data: result, message: `Processed ${result.processed}: ${result.upgraded} upgraded, ${result.downgraded} downgraded, ${result.unchanged} unchanged` });
    } catch (error) { next(error); }
  }
}

module.exports = new MembershipController();
