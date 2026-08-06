const { User, Role, Permission, RolePermission } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Require ALL specified permissions (AND logic)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      }

      // Super admins bypass RBAC
      if (req.user.isSuperAdmin) {
        return next();
      }

      const companyId = req.user.companyId;

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          through: { attributes: [], where: { companyId } },
          where: { companyId, isActive: true },
          required: true,
          include: [{
            model: Permission,
            through: { attributes: [] },
            where: { companyId, isActive: true },
            required: false,
          }],
        }],
      });

      if (!user) {
        return ApiResponse.forbidden(res, { message: 'User has no roles assigned' });
      }

      const userPermissions = new Set();
      if (user.roles) {
        user.roles.forEach(role => {
          if (role.permissions) {
            role.permissions.forEach(perm => userPermissions.add(perm.code));
          }
        });
      }

      const hasAll = requiredPermissions.every(p => userPermissions.has(p));
      if (!hasAll) {
        logger.warn(`Access denied: User ${req.user.username} missing permissions`, {
          required: requiredPermissions,
          userPermissions: [...userPermissions],
        });
        return ApiResponse.forbidden(res, { message: 'Insufficient permissions' });
      }

      req.userPermissions = [...userPermissions];
      req.userRoles = user.roles.map(r => ({ id: r.id, code: r.code, name: r.name }));
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', { error: error.message });
      return ApiResponse.error(res, { message: 'Authorization check failed' });
    }
  };
};

/**
 * Require ANY of the specified permissions (OR logic)
 */
const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      if (req.user.isSuperAdmin) return next();

      const companyId = req.user.companyId;
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          through: { attributes: [], where: { companyId } },
          where: { isActive: true },
          include: [{
            model: Permission,
            through: { attributes: [] },
            where: { isActive: true },
          }],
        }],
      });

      const userPermissions = new Set();
      if (user?.roles) {
        user.roles.forEach(role => {
          role.permissions?.forEach(perm => userPermissions.add(perm.code));
        });
      }

      const hasAny = permissions.some(p => userPermissions.has(p));
      if (!hasAny) {
        return ApiResponse.forbidden(res, { message: 'Insufficient permissions' });
      }

      req.userPermissions = [...userPermissions];
      next();
    } catch (error) {
      logger.error('RBAC any-permission middleware error:', { error: error.message });
      return ApiResponse.error(res, { message: 'Authorization check failed' });
    }
  };
};

/**
 * Require a specific role
 */
const requireRole = (...roleCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      if (req.user.isSuperAdmin) return next();

      const companyId = req.user.companyId;
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          through: { attributes: [], where: { companyId } },
          where: { companyId, isActive: true },
        }],
      });

      const userRoles = (user?.roles || []).map(r => r.code);
      const hasRole = roleCodes.some(code => userRoles.includes(code));

      if (!hasRole) {
        return ApiResponse.forbidden(res, { message: 'Requires specific role' });
      }

      next();
    } catch (error) {
      return ApiResponse.error(res, { message: 'Role check failed' });
    }
  };
};

module.exports = { requirePermission, requireAnyPermission, requireRole };
