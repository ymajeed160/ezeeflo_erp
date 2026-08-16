'use strict';
const CustomerPaymentService = require('../services/CustomerPaymentService');

class CustomerPaymentController {
  /**
   * POST /api/:tenantId/customer-payments
   */
  static async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user?.id;
      const result = await CustomerPaymentService.create(tenantId, req.body, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/:tenantId/customer-payments
   */
  static async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await CustomerPaymentService.list(tenantId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/:tenantId/customer-payments/:id
   */
  static async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await CustomerPaymentService.getById(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/:tenantId/customer-payments/:id
   */
  static async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CustomerPaymentService.update(tenantId, id, req.body, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/:tenantId/customer-payments/:id
   */
  static async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await CustomerPaymentService.delete(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/:tenantId/customer-payments/:id/post
   */
  static async post(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CustomerPaymentService.post(tenantId, id, userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/:tenantId/customer-payments/:id/cancel
   */
  static async cancel(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CustomerPaymentService.cancel(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerPaymentController;