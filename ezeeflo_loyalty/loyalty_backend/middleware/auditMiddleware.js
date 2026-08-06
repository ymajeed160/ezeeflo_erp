const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Audit Trail Middleware - logs all state-changing operations
 */
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // Store original send
    const originalSend = res.json.bind(res);
    
    // Intercept response
    res.json = function (body) {
      // Only log successful state-changing operations
      if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        try {
          const auditData = {
            companyId: req.user?.companyId || req.body?.companyId,
            userId: req.user?.id,
            action: action || `${req.method}_${entityType}`,
            entityType: entityType || req.originalUrl.split('/')[2] || 'unknown',
            entityId: req.params?.id || (typeof body === 'object' ? body?.data?.id : null),
            oldValues: req.oldValues || null,
            newValues: ['PUT', 'PATCH', 'POST'].includes(req.method) ? req.body : null,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent'),
            metadata: { url: req.originalUrl, method: req.method },
          };

          AuditLog.create(auditData).catch(err =>
            logger.error('Audit log creation failed:', { error: err.message })
          );
        } catch (err) {
          logger.error('Audit middleware error:', { error: err.message });
        }
      }
      return originalSend(body);
    };

    next();
  };
};

module.exports = auditMiddleware;
