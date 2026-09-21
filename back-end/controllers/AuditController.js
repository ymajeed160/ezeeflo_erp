const { AuditLog, Tenant, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const auditService = require('../services/AuditService');

class AuditController {
  /**
   * GET /api/audit-logs
   * List audit logs with filtering and pagination
   */
  async getAll(req, res, next) {
    try {
      const {
        page = 1, limit = 20,
        dateFrom, dateTo, userId, action, module,
        entity, entityId, source, status, search, companyId,
      } = req.query;

      const where = {};

      // Multi-company isolation: users see only their company's logs
      // Super admin can see all if they pass superadmin=true or omit companyId
      const requestingCompanyId = req.companyId || req.tenantId || req.user?.tenantId;
      if (requestingCompanyId) {
        where.tenantId = requestingCompanyId;
      }
      // Allow override for super admin
      if (companyId && req.user?.isSuperAdmin) {
        where.tenantId = companyId;
      }

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (module) where.module = module;
      if (entity) where.entity = entity;
      if (entityId) where.entityId = entityId;
      if (source) where.source = source;
      if (status) where.status = status;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
      }

      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { entity: { [Op.like]: `%${search}%` } },
          { entityReferenceNumber: { [Op.like]: `%${search}%` } },
          { userEmail: { [Op.like]: `%${search}%` } },
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { rows, count } = await AuditLog.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
          { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return ApiResponse.paginated(res, {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/:id
   * Get a single audit log detail
   */
  async getById(req, res, next) {
    try {
      const log = await AuditLog.findByPk(req.params.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
          { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
        ],
      });

      if (!log) {
        return ApiResponse.notFound(res, { message: 'Audit log not found' });
      }

      return ApiResponse.success(res, { data: log });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/entity/:entityType/:entityId
   * Get full history for a specific entity
   */
  async getEntityHistory(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const where = {
        entity: entityType,
        entityId,
      };

      const requestingCompanyId = req.companyId || req.tenantId || req.user?.tenantId;
      if (requestingCompanyId) {
        where.tenantId = requestingCompanyId;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { rows, count } = await AuditLog.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return ApiResponse.paginated(res, {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/user/:userId
   * Get audit logs for a specific user
   */
  async getByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const where = { userId };

      const requestingCompanyId = req.companyId || req.tenantId || req.user?.tenantId;
      if (requestingCompanyId) {
        where.tenantId = requestingCompanyId;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { rows, count } = await AuditLog.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return ApiResponse.paginated(res, {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/module/:module
   * Get audit logs for a specific module
   */
  async getByModule(req, res, next) {
    try {
      const { module: moduleName } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const where = { module: moduleName };

      const requestingCompanyId = req.companyId || req.tenantId || req.user?.tenantId;
      if (requestingCompanyId) {
        where.tenantId = requestingCompanyId;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { rows, count } = await AuditLog.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return ApiResponse.paginated(res, {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/company/:companyId
   * Get audit logs for a specific company (Super Admin only)
   */
  async getByCompany(req, res, next) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const { rows, count } = await AuditLog.findAndCountAll({
        where: { tenantId: companyId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return ApiResponse.paginated(res, {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/audit-logs/:id
   * Delete an audit log (Super Admin only)
   */
  async delete(req, res, next) {
    try {
      const log = await AuditLog.findByPk(req.params.id);
      if (!log) {
        return ApiResponse.notFound(res, { message: 'Audit log not found' });
      }

      await log.destroy();

      return ApiResponse.success(res, { message: 'Audit log deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/reports/user-activity
   * User Activity Report
   */
  async getUserActivityReport(req, res, next) {
    try {
      const { dateFrom, dateTo, companyId } = req.query;
      const where = {};

      if (companyId) where.tenantId = companyId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
      }

      const results = await AuditLog.findAll({
        where,
        attributes: [
          'userId', 'username', 'userEmail',
          [sequelize.fn('COUNT', sequelize.col('id')), 'actionCount'],
          [sequelize.fn('MAX', sequelize.col('created_at')), 'lastActivity'],
        ],
        group: ['userId', 'username', 'userEmail'],
        order: [[sequelize.literal('actionCount'), 'DESC']],
      });

      return ApiResponse.success(res, { data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/reports/login-activity
   * Login Activity Report
   */
  async getLoginReport(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const where = {
        module: 'Authentication',
        action: { [Op.in]: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT'] },
      };

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
      }

      const results = await AuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return ApiResponse.success(res, { data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/reports/data-changes
   * Data Change Report
   */
  async getDataChangeReport(req, res, next) {
    try {
      const { dateFrom, dateTo, companyId } = req.query;
      const where = {
        action: { [Op.in]: ['CREATE', 'UPDATE', 'DELETE'] },
      };

      if (companyId) where.tenantId = companyId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
      }

      const results = await AuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      return ApiResponse.success(res, { data: results });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
