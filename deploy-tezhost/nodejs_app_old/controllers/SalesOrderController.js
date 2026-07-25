'use strict';

const salesOrderService = require('../services/SalesOrderService');
const SalesOrderValidator = require('../validators/salesOrderValidator');

class SalesOrderController {
  async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { search, status, customerId, page, limit } = req.query;
      const result = await salesOrderService.list(tenantId, {
        search,
        status,
        customerId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const order = await salesOrderService.getById(tenantId, id);
      if (!order) return res.status(404).json({ success: false, message: 'Sales Order not found' });
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const validatedData = SalesOrderValidator.validateCreate(req.body);
      const result = await salesOrderService.create(tenantId, validatedData, userId);
      res.status(201).json({ success: true, data: result, message: 'Sales Order created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const validatedData = SalesOrderValidator.validateUpdate(req.body);
      const result = await salesOrderService.update(tenantId, id, validatedData, userId);
      res.json({ success: true, data: result, message: 'Sales Order updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      await salesOrderService.delete(tenantId, id, userId);
      res.json({ success: true, message: 'Sales Order deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async approve(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      SalesOrderValidator.validateApprove(req.body);
      const result = await salesOrderService.approve(tenantId, id, userId);
      res.json({ success: true, data: result, message: 'Sales Order approved successfully' });
    } catch (err) {
      next(err);
    }
  }

  async close(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const result = await salesOrderService.close(tenantId, id, userId);
      res.json({ success: true, data: result, message: 'Sales Order closed successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SalesOrderController();