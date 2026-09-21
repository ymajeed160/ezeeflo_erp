const authService = require('../services/AuthService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const audit = require('../services/AuditService');

class AuthController {
  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login({
        identifier,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      // Record successful login
      audit.recordLogin(req, result.user?.id, result.user?.username, result.user?.email, true);
      return ApiResponse.success(res, { data: result, message: 'Login successful' });
    } catch (error) {
      // Record failed login - look up user for context
      const user = require('../models').User;
      const found = await user.findOne({ where: { email: req.body?.identifier }, attributes: ['id', 'username', 'email'] }).catch(() => null);
      audit.recordLogin(req, found?.id, found?.username || req.body?.identifier, found?.email || req.body?.identifier, false, error.message);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return ApiResponse.badRequest(res, { message: 'Refresh token is required' });
      }
      const result = await authService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, { data: result, message: 'Token refreshed' });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user.id, refreshToken);
      audit.recordLogout(req);
      return ApiResponse.success(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id);
      return ApiResponse.success(res, { message: 'All sessions logged out' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, { currentPassword, newPassword });
      audit.recordPasswordChange(req, req.user.id);
      return ApiResponse.success(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return ApiResponse.success(res, {
        message: 'If the email exists, a reset link will be sent',
        data: process.env.NODE_ENV === 'development' ? result : null,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      return ApiResponse.success(res, { message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const userService = require('../services/UserService');
      const companyRepository = require('../repositories/CompanyRepository');
      const { user, permissions } = await userService.getUserProfile(
        req.user.id,
        req.user.tenantId
      );

      // Get user's companies
      const companies = await companyRepository.findUserCompanies(req.user.id);
      const defaultCompany = await companyRepository.getDefaultCompany(req.user.id);

      return ApiResponse.success(res, {
        data: {
          user,
          permissions,
          companies: companies.map(c => ({
            id: c.id,
            name: c.name,
            code: c.subdomain,
            email: c.email,
            logo: c.logo,
            currency: c.currencyCode,
            country: c.country,
            isActive: c.isActive,
            isDefault: c.UserTenants && c.UserTenants.length > 0 ? c.UserTenants[0].isDefault : false,
          })),
          defaultCompanyId: defaultCompany ? defaultCompany.id : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();