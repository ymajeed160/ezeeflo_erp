'use strict';
const SalesReturnService = require('../services/SalesReturnService');

class SalesReturnController {
  /**
   * POST /api/sales-returns
   */
  static async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user?.id;
      const result = await SalesReturnService.create(tenantId, req.body, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales-returns
   */
  static async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await SalesReturnService.list(tenantId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales-returns/:id
   */
  static async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await SalesReturnService.getById(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  /**
   * GET /api/:tenantId/sales-returns/invoices-for-return?customerId=xxx
   */
  static async listInvoicesForReturn(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const customerId = req.query.customerId || null;
      const result = await SalesReturnService.listInvoicesForReturn(tenantId, customerId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/:tenantId/sales-returns/returnable/:invoiceId
   */
  static async getReturnableInvoiceLines(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const invoiceId = req.params.invoiceId;
      const result = await SalesReturnService.getReturnableInvoiceLines(tenantId, invoiceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/:tenantId/sales-returns/:id/posting-preview
   */
  static async getPostingPreview(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await SalesReturnService.getPostingPreview(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  /**
   * PUT /api/sales-returns/:id
   */
  static async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.update(tenantId, id, req.body, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sales-returns/:id
   */
  static async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.delete(tenantId, id, userId, req.body?.reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-returns/:id/restore
   */
  static async restore(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.restore(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-returns/:id/cancel
   */
  static async cancel(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.cancel(tenantId, id, userId, req.body?.reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-returns/:id/approve
   */
  static async approve(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.approve(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-returns/:id/post
   */
  static async post(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.post(tenantId, id, userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-returns/:id/reject
   */
  static async reject(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesReturnService.reject(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SalesReturnController;