'use strict';
/**
 * AuditTrailService
 * Used by repositories to log audit trail entries.
 * Writes structured audit log entries to the database.
 */
const { sequelize } = require('../models');

class AuditTrailService {
  static async log({ tenantId, userId, action, entity, entityId, oldValues, newValues, reference, referenceId, notes }) {
    try {
      const query = `
        INSERT INTO "AuditLogs" 
        ("tenantId", "userId", "action", "entity", "entityId", "oldValues", "newValues", "reference", "referenceId", "notes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `;
      await sequelize.query(query, {
        bind: [
          tenantId,
          userId,
          action,
          entity,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          reference || null,
          referenceId || null,
          notes || null,
        ],
        type: sequelize.QueryTypes.INSERT,
      });
    } catch (error) {
      console.error('AuditTrailService.log error:', error.message);
      // Do not throw - audit log errors should not break the main flow
    }
  }
}

module.exports = AuditTrailService;