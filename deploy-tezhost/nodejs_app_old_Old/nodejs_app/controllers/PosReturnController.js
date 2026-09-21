'use strict';
const PosReturnService = require('../services/PosReturnService');
const ApiResponse = require('../utils/apiResponse');

class PosReturnController {
  static async list(req, res, next) {
    try {
      const result = await PosReturnService.list(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const ret = await PosReturnService.getById(req.tenantId, req.params.id);
      return ApiResponse.success(res, { data: ret });
    } catch (error) { next(error); }
  }

  static async processReturn(req, res, next) {
    try {
      const ret = await PosReturnService.processReturn(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: ret, message: 'Return processed successfully' });
    } catch (error) { next(error); }
  }
}

module.exports = PosReturnController;
