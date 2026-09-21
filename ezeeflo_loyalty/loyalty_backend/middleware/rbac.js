/**
 * RBAC barrel file - convenience re-exports
 */
const { requirePermission, requireAnyPermission, requireRole } = require('./rbacMiddleware');

module.exports = requirePermission;
module.exports.requirePermission = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
module.exports.requireRole = requireRole;
module.exports.authorize = requirePermission;
module.exports.checkPermission = requirePermission;
