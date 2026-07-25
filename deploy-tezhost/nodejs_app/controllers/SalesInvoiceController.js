'use strict';
const SalesInvoiceService = require('../services/SalesInvoiceService');
const { validationResult } = require('express-validator');

class SalesInvoiceController {
  /**
   * POST /api/:tenantId/sales-invoices
   */
  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.create(tenantId, req.body, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-invoices/from-sales-order/:id
   */
  static async generateFromSalesOrder(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const salesOrderId = req.params.id;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.generateFromSalesOrder(tenantId, salesOrderId, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-invoices/from-delivery-note/:id
   */
  static async generateFromDeliveryNote(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const deliveryNoteId = req.params.id;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.generateFromDeliveryNote(tenantId, deliveryNoteId, userId);
      res.status(201).json({ success: true, data: result, message: 'Sales Invoice generated from Delivery Note successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales-invoices
   */
  static async list(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const result = await SalesInvoiceService.list(tenantId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales-invoices/for-allocation?customerId=xxx
   * Returns posted invoices with outstanding balance > 0 for the given customer
   */
  static async listForAllocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const customerId = req.query.customerId;
      const paymentId = req.query.paymentId || null;
      const result = await SalesInvoiceService.listForAllocation(tenantId, customerId, paymentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sales-invoices/:id
   */
  static async getById(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await SalesInvoiceService.getById(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sales-invoices/:id
   */
  static async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.update(tenantId, id, req.body, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sales-invoices/:id
   */
  static async delete(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const result = await SalesInvoiceService.delete(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-invoices/:id/post
   */
  static async post(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.post(tenantId, id, userId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sales-invoices/:id/cancel
   */
  static async cancel(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await SalesInvoiceService.cancel(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SalesInvoiceController;