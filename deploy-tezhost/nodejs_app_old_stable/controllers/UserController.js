const userService = require('../services/UserService');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  async getAll(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.user.tenantId, req.query);
      return ApiResponse.paginated(res, { data: result.users, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: user });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user.tenantId, req.user.id);
      return ApiResponse.created(res, { data: user, message: 'User created successfully' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: user, message: 'User updated successfully' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'User deleted successfully' });
    } catch (error) { next(error); }
  }

  async toggleStatus(req, res, next) {
    try {
      const result = await userService.toggleUserStatus(req.params.id, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: result, message: `User ${result.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
  }

  async unlock(req, res, next) {
    try {
      await userService.unlockUser(req.params.id, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { message: 'User unlocked successfully' });
    } catch (error) { next(error); }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body, req.user.tenantId);
      return ApiResponse.success(res, { data: user, message: 'Profile updated' });
    } catch (error) { next(error); }
  }
}

module.exports = new UserController();