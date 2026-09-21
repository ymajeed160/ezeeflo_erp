const auditService = require('../services/AuditService');
const logger = require('../utils/logger');

/**
 * Middleware-level Audit Factory
 * 
 * Creates middleware that automatically records audit events after
 * successful API responses.
 * 
 * Usage:
 *   const { audit } = require('../middleware');
 *   router.post('/', audit('CREATE', 'Sales', 'Customer'), controller.create);
 *   router.put('/:id', audit('UPDATE', 'Sales', 'Customer'), controller.update);
 */
const auditMiddleware = (action, module, entity) => {
  return (req, res, next) => {
    let entityId = null;
    let oldValues = null;

    // Capture old values for updates - stored on req by controller
    if (req.auditOldValues) {
      oldValues = req.auditOldValues;
    }

    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 400 && body?.success !== false) {
          const bodyData = body?.data || body?.result || null;

          if (action === 'CREATE' && bodyData?.id) {
            entityId = bodyData.id;
          } else if (req.params?.id) {
            entityId = req.params.id;
          } else if (bodyData?.id) {
            entityId = bodyData.id;
          }

          const newValues = (action === 'CREATE' || action === 'UPDATE') ? req.body : null;

          await auditService.record(req, action, module, entity, entityId, {
            oldValues,
            newValues,
            entityReferenceNumber: bodyData?.referenceNumber || bodyData?.reference_number || bodyData?.subscriptionNumber || null,
          });
        }
      } catch (error) {
        logger.error('Audit middleware error:', { error: error.message, action, entity });
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = auditMiddleware;