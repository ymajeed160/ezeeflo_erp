'use strict';

const service = require('../services/PurchaseReturnService');
const { validateCreate, validateUpdate, validateApprove, validateReject } = require('../validators/purchaseReturnValidator');

class PurchaseReturnController {
  async getAll(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { search, status, supplierId, referenceType, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
      const result = await service.getAll(tenantId, {
        search, status, supplierId, referenceType, startDate, endDate,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 25,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC'
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const record = await service.getById(req.params.id, tenantId);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const { error, value } = validateCreate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details.map(e => e.message) });
      }

      const record = await service.create(tenantId, value, userId);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const { error, value } = validateUpdate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details.map(e => e.message) });
      }

      const record = await service.update(req.params.id, tenantId, value, userId);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const { error } = validateApprove(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details.map(e => e.message) });
      }

      const record = await service.approve(req.params.id, tenantId, userId);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const { error, value } = validateReject(req.body || {});
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details.map(e => e.message) });
      }

      const record = await service.reject(req.params.id, tenantId, userId, value?.reason);
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await service.delete(req.params.id, tenantId);
      res.json({ success: true, message: 'Purchase Return deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseReturnController();