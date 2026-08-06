const ruleEngineService = require('../services/RuleEngineService');
const ApiResponse = require('../utils/apiResponse');

class LoyaltyRuleController {
  async getAll(req, res, next) {
    try {
      const result = await ruleEngineService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const rule = await ruleEngineService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: rule });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const rule = await ruleEngineService.create(req.body, req.user.companyId, req.user.id);
      return ApiResponse.created(res, { data: rule, message: 'Rule created successfully' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const rule = await ruleEngineService.update(req.params.id, req.body, req.user.companyId);
      return ApiResponse.success(res, { data: rule, message: 'Rule updated successfully' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await ruleEngineService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Rule deleted successfully' });
    } catch (error) { next(error); }
  }

  async toggleStatus(req, res, next) {
    try {
      const rule = await ruleEngineService.toggleStatus(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: rule, message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
  }

  async evaluate(req, res, next) {
    try {
      const context = { ...req.body, companyId: req.user.companyId };
      const result = await ruleEngineService.calculateEarnPoints(context);
      return ApiResponse.success(res, { data: result });
    } catch (error) { next(error); }
  }
}

module.exports = new LoyaltyRuleController();
