const { User, Role, Permission, RolePermission } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * RBAC Middleware - checks if the authenticated user has the required permission(s)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      }

      // Determine the active tenant context
      const tenantId = req.tenantId || req.user?.tenantId;

      // Get user's roles with permissions — scoped to the active company
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            through: {
              attributes: [],
              where: { tenantId },
            },
            where: { tenantId, isActive: true },
            required: true,
            include: [
              {
                model: Permission,
                through: { attributes: [] },
                where: { tenantId, isActive: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!user) {
        return ApiResponse.unauthorized(res, { message: 'User not found' });
      }

      // Collect all permissions from all roles
      const userPermissions = new Set();
      if (user.Roles) {
        user.Roles.forEach(role => {
          if (role.Permissions) {
            role.Permissions.forEach(permission => {
              userPermissions.add(permission.code);
            });
          }
        });
      }

      // Check if user has ALL required permissions
      const hasAllPermissions = requiredPermissions.every(perm =>
        userPermissions.has(perm)
      );

      if (!hasAllPermissions) {
        logger.warn(
          `Access denied: User ${req.user.username} missing required permissions`,
          { required: requiredPermissions, userPermissions: [...userPermissions] }
        );
        return ApiResponse.forbidden(res, {
          message: 'Insufficient permissions to perform this action',
        });
      }

      // Attach user permissions to request for further checks if needed
      req.userPermissions = [...userPermissions];
      req.userRoles = user.Roles.map(r => ({ id: r.id, code: r.code, name: r.name }));

      next();
    } catch (error) {
      logger.error('RBAC middleware error:', { error: error.message, stack: error.stack });
      return ApiResponse.error(res, { message: 'Authorization check failed' });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 */
const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      }

      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            through: { attributes: [] },
            where: { isActive: true },
            include: [
              {
                model: Permission,
                through: { attributes: [] },
                where: { isActive: true },
              },
            ],
          },
        ],
      });

      if (!user) {
        return ApiResponse.unauthorized(res, { message: 'User not found' });
      }

      const userPermissions = new Set();
      if (user.Roles) {
        user.Roles.forEach(role => {
          if (role.Permissions) {
            role.Permissions.forEach(permission => {
              userPermissions.add(permission.code);
            });
          }
        });
      }

      const hasAnyPermission = permissions.some(perm => userPermissions.has(perm));

      if (!hasAnyPermission) {
        return ApiResponse.forbidden(res, {
          message: 'Insufficient permissions to perform this action',
        });
      }

      req.userPermissions = [...userPermissions];
      req.userRoles = user.Roles.map(r => ({ id: r.id, code: r.code, name: r.name }));
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', { error: error.message });
      return ApiResponse.error(res, { message: 'Authorization check failed' });
    }
  };
};

/**
 * Check if user has a specific role
 */
const requireRole = (...roleCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, { message: 'Authentication required' });
      }

      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            through: { attributes: [] },
            where: { isActive: true },
          },
        ],
      });

      if (!user || !user.Roles) {
        return ApiResponse.forbidden(res, { message: 'Insufficient role privileges' });
      }

      const userRoleCodes = user.Roles.map(r => r.code);
      const hasRole = roleCodes.some(code => userRoleCodes.includes(code));

      if (!hasRole) {
        return ApiResponse.forbidden(res, { message: 'Insufficient role privileges' });
      }

      next();
    } catch (error) {
      logger.error('Role check middleware error:', { error: error.message });
      return ApiResponse.error(res, { message: 'Role check failed' });
    }
  };
};

module.exports = { requirePermission, requireAnyPermission, requireRole };