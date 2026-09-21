'use strict';
const { AuditLog } = require('../models');

class AuditLogService {
  /**
   * Create an audit log entry.
   * @param {number|string} tenantId
   * @param {number|string} userId
   * @param {string} entity - e.g. 'Quotation', 'SalesOrder'
   * @param {number|string} entityId
   * @param {string} action - e.g. 'Created', 'Updated', 'Deleted', 'Status changed'
   * @param {object} [details] - optional data payload
   */
  static async log(tenantId, userId, entity, entityId, action, details = null) {
    try {
      await AuditLog.create({
        tenantId,
        userId,
        entity,
        entityId,
        action,
        description: details ? JSON.stringify(details) : null,
        newValues: details || null,
      });
    } catch (err) {
      // Log failure should never break primary operation
      console.error('AuditLogService.log failed:', err.message);
    }
  }
}

module.exports = AuditLogService;