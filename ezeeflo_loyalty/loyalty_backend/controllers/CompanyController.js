const companyService = require('../services/CompanyService');
const ApiResponse = require('../utils/apiResponse');

class CompanyController {
  async getAll(req, res, next) {
    try {
      const result = await companyService.getAll(req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const company = await companyService.getById(req.params.id);
      return ApiResponse.success(res, { data: company });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await companyService.create(req.body);
      return ApiResponse.created(res, { data: result, message: 'Company created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const company = await companyService.update(req.params.id, req.body);
      return ApiResponse.success(res, { data: company, message: 'Company updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const company = await companyService.updateStatus(req.params.id, req.body.status);
      return ApiResponse.success(res, { data: company, message: 'Company status updated' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await companyService.delete(req.params.id);
      return ApiResponse.success(res, { message: 'Company deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const company = await companyService.getProfile(req.user.companyId);
      return ApiResponse.success(res, { data: company });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const company = await companyService.updateProfile(req.user.companyId, req.body);
      return ApiResponse.success(res, { data: company, message: 'Company profile updated' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();
