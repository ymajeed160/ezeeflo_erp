'use strict';
/**
 * Middleware barrel file.
 * Re-exports all middleware so routes can do:
 *   const { authenticate, authorize, tenancy, validate, audit } = require('../middleware');
 */
const { authMiddleware, optionalAuth } = require('./authMiddleware');
const { requirePermission, requireRole } = require('./rbacMiddleware');
const tenantContext = require('./tenantContext');
const validate = require('./validate');
const auditMiddleware = require('./auditMiddleware');

module.exports = {
  authenticate: authMiddleware,
  authMiddleware,
  optionalAuth,
  authorize: requirePermission,
  requirePermission,
  requireRole,
  tenancy: tenantContext,
  tenantContext,
  validate,
  audit: auditMiddleware,
};