'use strict';
/**
 * RBAC middleware barrel / alias file.
 * Re-exports from rbacMiddleware so that existing route files
 * which require('../middleware/rbac') continue to work.
 * The default export is the requirePermission factory function,
 * which is used as: rbac('permission.code') returning a middleware.
 */
const { requirePermission, requireAnyPermission, requireRole } = require('./rbacMiddleware');

module.exports = requirePermission;
module.exports.requirePermission = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
module.exports.requireRole = requireRole;
module.exports.authorize = requirePermission;
module.exports.checkPermission = requirePermission;
