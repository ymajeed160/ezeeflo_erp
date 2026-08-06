const authService = require('../services/AuthService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login({
        username, password,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      return ApiResponse.success(res, { data: result, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return ApiResponse.badRequest(res, { message: 'Refresh token required' });
      const result = await authService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user.id, refreshToken);
      return ApiResponse.success(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      return ApiResponse.success(res, { data: req.user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      await authService.changePassword(req.user.id, req.body);
      return ApiResponse.success(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      return ApiResponse.success(res, { message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      return ApiResponse.success(res, { message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
