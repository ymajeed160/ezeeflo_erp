'use strict';
const PosCashManagementService = require('../services/PosCashManagementService');
const ApiResponse = require('../utils/apiResponse');

class PosCashManagementController {
  static async list(req, res, next) {
    try {
      const result = await PosCashManagementService.list(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }

  static async recordMovement(req, res, next) {
    try {
      const movement = await PosCashManagementService.recordMovement(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: movement, message: 'Cash movement recorded successfully' });
    } catch (error) { next(error); }
  }
}

module.exports = PosCashManagementController;
