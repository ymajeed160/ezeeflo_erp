'use strict';
const PosSessionService = require('../services/PosSessionService');
const ApiResponse = require('../utils/apiResponse');

class PosSessionController {
  static async list(req, res, next) {
    try {
      const result = await PosSessionService.list(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const session = await PosSessionService.getById(req.tenantId, req.params.id);
      return ApiResponse.success(res, { data: session });
    } catch (error) { next(error); }
  }

  static async getActiveSession(req, res, next) {
    try {
      const { terminalId } = req.query;
      const session = await PosSessionService.getActiveSession(req.tenantId, req.user.id, terminalId);
      return ApiResponse.success(res, { data: session });
    } catch (error) { next(error); }
  }

  static async openSession(req, res, next) {
    try {
      const session = await PosSessionService.openSession(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: session, message: 'POS Session opened successfully' });
    } catch (error) { next(error); }
  }

  static async closeSession(req, res, next) {
    try {
      const session = await PosSessionService.closeSession(req.tenantId, req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, { data: session, message: 'POS Session closed successfully' });
    } catch (error) { next(error); }
  }

  static async getSessionSummary(req, res, next) {
    try {
      const summary = await PosSessionService.getSessionSummary(req.tenantId, req.params.id);
      return ApiResponse.success(res, { data: summary });
    } catch (error) { next(error); }
  }
}

module.exports = PosSessionController;
