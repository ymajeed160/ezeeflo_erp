'use strict';
/**
 * GenericAuditService - re-export of AuditService for modules that
 * import it under the GenericAuditService name.
 */
const AuditService = require('./AuditService');
module.exports = AuditService;