const rewardService = require('../services/RewardService');
const ApiResponse = require('../utils/apiResponse');

class RewardController {
  async getAll(req, res, next) {
    try {
      const result = await rewardService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const reward = await rewardService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: reward });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const reward = await rewardService.create(req.body, req.user.companyId);
      return ApiResponse.created(res, { data: reward, message: 'Reward created' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const reward = await rewardService.update(req.params.id, req.body, req.user.companyId);
      return ApiResponse.success(res, { data: reward, message: 'Reward updated' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await rewardService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Reward deleted' });
    } catch (error) { next(error); }
  }

  async toggleStatus(req, res, next) {
    try {
      const reward = await rewardService.toggleStatus(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: reward, message: `Reward ${reward.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
  }

  async redeem(req, res, next) {
    try {
      const result = await rewardService.redeemReward({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      return ApiResponse.success(res, { data: result, message: `Reward "${result.reward.name}" redeemed! ${result.pointsRemaining} points remaining.` });
    } catch (error) { next(error); }
  }

  async cancelRedemption(req, res, next) {
    try {
      const result = await rewardService.cancelRedemption(req.params.redemptionId, req.user.companyId, req.user.id);
      return ApiResponse.success(res, { data: result, message: 'Redemption canceled and points restored' });
    } catch (error) { next(error); }
  }

  async getRedemptions(req, res, next) {
    try {
      const result = await rewardService.getRedemptions(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
}

module.exports = new RewardController();
