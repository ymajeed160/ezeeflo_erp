'use strict';
const PosTerminalService = require('../services/PosTerminalService');
const ApiResponse = require('../utils/apiResponse');

class PosTerminalController {
  static async list(req, res, next) {
    try {
      const result = await PosTerminalService.list(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const terminal = await PosTerminalService.getById(req.tenantId, req.params.id);
      return ApiResponse.success(res, { data: terminal });
    } catch (error) { next(error); }
  }

  static async create(req, res, next) {
    try {
      const terminal = await PosTerminalService.create(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: terminal, message: 'POS Terminal created successfully' });
    } catch (error) { next(error); }
  }

  static async update(req, res, next) {
    try {
      const terminal = await PosTerminalService.update(req.tenantId, req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, { data: terminal, message: 'POS Terminal updated successfully' });
    } catch (error) { next(error); }
  }

  static async delete(req, res, next) {
    try {
      const result = await PosTerminalService.delete(req.tenantId, req.params.id);
      return ApiResponse.success(res, { message: result.message });
    } catch (error) { next(error); }
  }

  static async getUserTerminals(req, res, next) {
    try {
      const terminals = await PosTerminalService.getUserTerminals(req.tenantId, req.user.id);
      return ApiResponse.success(res, { data: terminals });
    } catch (error) { next(error); }
  }
}

module.exports = PosTerminalController;
