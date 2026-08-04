'use strict';
const CreditNoteService = require('../services/CreditNoteService');

class CreditNoteController {
  /**
   * POST /api/credit-notes
   */
  static async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      const result = await CreditNoteService.create(tenantId, req.body, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/credit-notes
   */
  static async list(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const result = await CreditNoteService.list(tenantId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/credit-notes/:id
   */
  static async getById(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const id = req.params.id;
      const result = await CreditNoteService.getById(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/credit-notes/:id
   */
  static async update(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CreditNoteService.update(tenantId, id, req.body, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/credit-notes/:id
   */
  static async delete(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const id = req.params.id;
      const result = await CreditNoteService.delete(tenantId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/credit-notes/:id/post
   */
  static async post(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CreditNoteService.post(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/credit-notes/:id/cancel
   */
  static async cancel(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const id = req.params.id;
      const userId = req.user?.id;
      const result = await CreditNoteService.cancel(tenantId, id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CreditNoteController;