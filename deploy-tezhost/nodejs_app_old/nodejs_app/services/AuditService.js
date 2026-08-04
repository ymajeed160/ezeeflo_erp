const { AuditLog } = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Centralized Audit Service
 * 
 * Records enterprise-grade audit trails for all system actions.
 * Usage: const audit = require('../services/AuditService');
 *        await audit.record(req, 'CREATE', 'Sales', 'Customer', customerId, { ... });
 * 
 * For system/scheduled jobs without a request context:
 *        await audit.recordSystem('CREATE', 'Sales', 'Customer', customerId, { ... });
 */

const SENSITIVE_FIELDS = new Set([
  'password', 'passwordHash', 'refreshToken', 'resetPasswordToken',
  'resetToken', 'token', 'secret', 'apiKey', 'apiSecret',
  'creditCard', 'cvv', 'cardNumber',
]);

const MASKED_VALUE = '********';

class AuditService {
  /**
   * Get context from Express request object
   */
  _getContext(req) {
    if (!req) return {};

    return {
      userId: req.user?.id || req.userId || null,
      username: req.user?.username || req.user?.name || 'system',
      userEmail: req.user?.email || null,
      userRole: req.user?.role || req.userRole || null,
      tenantId: req.tenantId || req.companyId || req.user?.tenantId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers?.['user-agent'] || null,
      requestId: req.id || req.requestId || null,
      sessionId: req.session?.id || null,
    };
  }

  /**
   * Sanitize values to remove sensitive fields
   */
  _sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_FIELDS.has(key)) {
        sanitized[key] = MASKED_VALUE;
      }
    }
    return sanitized;
  }

  /**
   * Compute changed fields between old and new values
   */
  _computeChanges(oldValues, newValues) {
    if (!oldValues || !newValues) {
      return {
        changedFields: [],
        oldValues: oldValues || null,
        newValues: newValues || null,
      };
    }

    const oldNorm = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues;
    const newNorm = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;

    const changedFields = [];
    const oldFiltered = {};
    const newFiltered = {};

    const allKeys = new Set([...Object.keys(oldNorm || {}), ...Object.keys(newNorm || {})]);

    for (const key of allKeys) {
      if (SENSITIVE_FIELDS.has(key)) continue;

      const oldVal = oldNorm?.[key];
      const newVal = newNorm?.[key];

      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        changedFields.push(key);
        oldFiltered[key] = oldVal ?? null;
        newFiltered[key] = newVal ?? null;
      }
    }

    return {
      changedFields,
      oldValues: Object.keys(oldFiltered).length > 0 ? oldFiltered : null,
      newValues: Object.keys(newFiltered).length > 0 ? newFiltered : null,
    };
  }

  /**
   * Core method to record an audit entry
   */
  async _record({
    tenantId,
    userId,
    username,
    userEmail,
    userRole,
    action,
    module,
    entity,
    entityId,
    entityReferenceNumber,
    oldValues,
    newValues,
    description,
    ipAddress,
    userAgent,
    requestId,
    sessionId,
    source = 'USER',
    status = 'success',
    errorMessage,
    metadata,
  } = {}) {
    try {
      const changes = this._computeChanges(oldValues, newValues);

      const auditEntry = {
        id: uuidv4(),
        tenantId: tenantId || null,
        userId,
        username: username || 'system',
        userEmail,
        userRole,
        action,
        module,
        entity,
        entityId,
        entityReferenceNumber,
        oldValues: changes.oldValues || oldValues || null,
        newValues: changes.newValues || newValues || null,
        changedFields: changes.changedFields.length > 0 ? changes.changedFields : null,
        description: description || `${action} ${entity}`,
        ipAddress,
        userAgent,
        requestId,
        sessionId,
        source,
        status: status || 'success',
        errorMessage,
        metadata: metadata || null,
      };

      await AuditLog.create(auditEntry);
      return auditEntry;
    } catch (error) {
      // Never let audit logging break the main operation
      logger.error('AuditService._record error:', { error: error.message, action, entity });
      return null;
    }
  }

  /**
   * Record an audit event from an Express request context
   */
  async record(req, action, module, entity, entityId, options = {}) {
    const ctx = this._getContext(req);
    return this._record({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      username: ctx.username,
      userEmail: ctx.userEmail,
      userRole: ctx.userRole,
      action,
      module,
      entity,
      entityId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      source: 'USER',
      ...options,
    });
  }

  /**
   * Record a CREATE event
   */
  async recordCreate(req, module, entity, entityId, newValues, options = {}) {
    return this.record(req, 'CREATE', module, entity, entityId, {
      newValues: this._sanitize(newValues),
      description: `${entity} created`,
      ...options,
    });
  }

  /**
   * Record an UPDATE event with field-level comparison
   */
  async recordUpdate(req, module, entity, entityId, oldValues, newValues, options = {}) {
    return this.record(req, 'UPDATE', module, entity, entityId, {
      oldValues: this._sanitize(oldValues),
      newValues: this._sanitize(newValues),
      description: `${entity} updated`,
      ...options,
    });
  }

  /**
   * Record a DELETE event
   */
  async recordDelete(req, module, entity, entityId, oldValues, options = {}) {
    return this.record(req, 'DELETE', module, entity, entityId, {
      oldValues: this._sanitize(oldValues),
      description: `${entity} deleted`,
      ...options,
    });
  }

  /**
   * Record a VIEW event
   */
  async recordView(req, module, entity, entityId, options = {}) {
    return this.record(req, 'VIEW', module, entity, entityId, {
      description: `${entity} viewed`,
      ...options,
    });
  }

  /**
   * Record a generic action (SUBMIT, APPROVE, REJECT, POST, etc.)
   */
  async recordAction(req, action, module, entity, entityId, options = {}) {
    return this.record(req, action, module, entity, entityId, {
      description: options.description || `${action} on ${entity}`,
      ...options,
    });
  }

  /**
   * Record a login event
   */
  async recordLogin(req, userId, username, email, success = true, failureReason = null) {
    return this._record({
      tenantId: null,
      userId,
      username,
      userEmail: email,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      module: 'Authentication',
      entity: 'User',
      entityId: userId,
      description: success ? 'User logged in' : `Login failed${failureReason ? ': ' + failureReason : ''}`,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
      requestId: req?.id || null,
      source: 'USER',
      status: success ? 'success' : 'failure',
      errorMessage: failureReason,
    });
  }

  /**
   * Record a logout event
   */
  async recordLogout(req) {
    return this.record(req, 'LOGOUT', 'Authentication', 'User', req.user?.id, {
      description: 'User logged out',
    });
  }

  /**
   * Record a company switch event
   */
  async recordCompanySwitch(req, previousCompanyId, previousCompanyName, newCompanyId, newCompanyName) {
    return this.record(req, 'COMPANY_SWITCHED', 'Authentication', 'Company', newCompanyId, {
      oldValues: { companyId: previousCompanyId, companyName: previousCompanyName },
      newValues: { companyId: newCompanyId, companyName: newCompanyName },
      description: `Switched from ${previousCompanyName || 'none'} to ${newCompanyName}`,
    });
  }

  /**
   * Record a password change event
   */
  async recordPasswordChange(req, userId) {
    return this.record(req, 'PASSWORD_CHANGED', 'Authentication', 'User', userId, {
      description: 'Password changed',
      newValues: { password: MASKED_VALUE },
    });
  }

  /**
   * Record a permission change event
   */
  async recordPermissionChange(req, roleId, roleName, oldPermissions, newPermissions) {
    return this.record(req, 'PERMISSION_CHANGED', 'Administration', 'Role', roleId, {
      oldValues: { permissions: oldPermissions },
      newValues: { permissions: newPermissions },
      entityReferenceNumber: roleName,
      description: `Permissions changed for role: ${roleName}`,
    });
  }

  /**
   * Record a subscription change event
   */
  async recordSubscriptionChange(req, subscriptionId, companyId, oldValues, newValues) {
    return this._record({
      tenantId: companyId,
      userId: req?.userId || req?.user?.id,
      username: req?.user?.username || 'system',
      userEmail: req?.user?.email,
      action: 'SUBSCRIPTION_CHANGED',
      module: 'Subscriptions',
      entity: 'CompanySubscription',
      entityId: subscriptionId,
      oldValues,
      newValues,
      description: 'Subscription changed',
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      source: 'USER',
    });
  }

  /**
   * Record a system-generated event
   */
  async recordSystem(action, module, entity, entityId, options = {}) {
    return this._record({
      action,
      module,
      entity,
      entityId,
      source: options.source || 'SYSTEM',
      status: options.status || 'success',
      ...options,
    });
  }

  /**
   * Record a settings change
   */
  async recordSettingsChange(req, settingsModule, oldValues, newValues) {
    return this.record(req, 'SETTINGS_CHANGED', 'Settings', settingsModule, null, {
      oldValues,
      newValues,
      description: `Settings updated: ${settingsModule}`,
    });
  }

  /**
   * Record user creation
   */
  async recordUserCreated(req, userId, userData) {
    return this.record(req, 'USER_CREATED', 'Administration', 'User', userId, {
      newValues: this._sanitize(userData),
      description: `User created: ${userData?.email || userId}`,
    });
  }

  /**
   * Record module toggle
   */
  async recordModuleToggle(req, moduleCode, moduleName, enabled) {
    return this.record(req, enabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED', 'Administration', 'SubscriptionModule', null, {
      entityReferenceNumber: moduleCode,
      description: `${enabled ? 'Enabled' : 'Disabled'} module: ${moduleName}`,
    });
  }
}

// Export singleton instance
module.exports = new AuditService();
