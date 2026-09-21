const userService = require('../services/UserService');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  async getAll(req, res, next) {
    try {
      const result = await userService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body, req.user.companyId, req.user.id);
      return ApiResponse.created(res, { data: user, message: 'User created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body, req.user.companyId, req.user.id);
      return ApiResponse.success(res, { data: user, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const user = await userService.toggleStatus(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: user, message: 'User status toggled' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
