'use strict';
/**
 * Tenant context middleware.
 * Ensures req.tenantId is available — prefers company context,
 * falls back to user's home tenantId from JWT.
 */
const hasTenant = (req, res, next) => {
  // Prefer company context (set by companyMiddleware)
  if (req.tenantId) {
    return next();
  }
  // Fall back to user's home tenant from JWT
  if (req.user && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }
  return res.status(403).json({ success: false, message: 'Tenant context required' });
};

module.exports = hasTenant;