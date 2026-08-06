const superAdminPlanService = require('../../services/SuperAdminPlanService');
const ApiResponse = require('../../utils/apiResponse');

class SuperAdminPlanController {
  async getAll(req, res, next) {
    try {
      const result = await superAdminPlanService.getAll(req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const plan = await superAdminPlanService.getById(req.params.id);
      return ApiResponse.success(res, { data: plan });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const plan = await superAdminPlanService.create(req.body);
      return ApiResponse.created(res, { data: plan, message: 'Plan created' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const plan = await superAdminPlanService.update(req.params.id, req.body);
      return ApiResponse.success(res, { data: plan, message: 'Plan updated' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await superAdminPlanService.delete(req.params.id);
      return ApiResponse.success(res, { message: 'Plan deleted' });
    } catch (error) { next(error); }
  }

  async toggleStatus(req, res, next) {
    try {
      const plan = await superAdminPlanService.toggleStatus(req.params.id);
      return ApiResponse.success(res, { data: plan, message: 'Plan status toggled' });
    } catch (error) { next(error); }
  }

  // Modules
  async getModules(req, res, next) {
    try {
      const modules = await superAdminPlanService.getModules();
      return ApiResponse.success(res, { data: modules });
    } catch (error) { next(error); }
  }

  async createModule(req, res, next) {
    try {
      const module = await superAdminPlanService.createModule(req.body);
      return ApiResponse.created(res, { data: module });
    } catch (error) { next(error); }
  }

  async updateModule(req, res, next) {
    try {
      const module = await superAdminPlanService.updateModule(req.params.id, req.body);
      return ApiResponse.success(res, { data: module });
    } catch (error) { next(error); }
  }

  async deleteModule(req, res, next) {
    try {
      await superAdminPlanService.deleteModule(req.params.id);
      return ApiResponse.success(res, { message: 'Module deleted' });
    } catch (error) { next(error); }
  }

  // Dashboard
  async getDashboardStats(req, res, next) {
    try {
      const stats = await superAdminPlanService.getDashboardStats();
      return ApiResponse.success(res, { data: stats });
    } catch (error) { next(error); }
  }

  // Assign plan to company
  async assignPlan(req, res, next) {
    try {
      const result = await superAdminPlanService.assignPlanToCompany(req.params.companyId, req.body.planId, req.body);
      return ApiResponse.success(res, { data: result, message: 'Plan assigned' });
    } catch (error) { next(error); }
  }
}

module.exports = new SuperAdminPlanController();
