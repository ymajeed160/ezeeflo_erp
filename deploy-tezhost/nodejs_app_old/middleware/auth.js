'use strict';
/**
 * Auth middleware barrel / alias file.
 * Re-exports from authMiddleware and rbacMiddleware so that
 * existing route files which require('../middleware/auth') continue to work.
 */
const { authMiddleware, optionalAuth } = require('./authMiddleware');
const { requirePermission } = require('./rbacMiddleware');

// Default export = the auth middleware function
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.optionalAuth = optionalAuth;
module.exports.authenticate = authMiddleware;
// These are RBAC factories: authorize / checkPermission
module.exports.authorize = requirePermission;
module.exports.checkPermission = requirePermission;
module.exports.authorizeTenant = authMiddleware;
