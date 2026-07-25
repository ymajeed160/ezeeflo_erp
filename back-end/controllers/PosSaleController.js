'use strict';
const PosSaleService = require('../services/PosSaleService');
const ApiResponse = require('../utils/apiResponse');

class PosSaleController {
  static async list(req, res, next) {
    try {
      const result = await PosSaleService.list(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }

  static async getById(req, res, next) {
    try {
      const sale = await PosSaleService.getById(req.tenantId, req.params.id);
      return ApiResponse.success(res, { data: sale });
    } catch (error) { next(error); }
  }

  static async completeSale(req, res, next) {
    try {
      const sale = await PosSaleService.completeSale(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: sale, message: 'POS Sale completed successfully' });
    } catch (error) { next(error); }
  }

  static async cancelSale(req, res, next) {
    try {
      const result = await PosSaleService.cancelSale(req.tenantId, req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, { message: result.message, invoiceNumber: result.invoiceNumber });
    } catch (error) { next(error); }
  }

  static async holdOrder(req, res, next) {
    try {
      const order = await PosSaleService.holdOrder(req.tenantId, req.body, req.user.id);
      return ApiResponse.created(res, { data: order, message: 'Order held successfully' });
    } catch (error) { next(error); }
  }

  static async retrieveHeldOrder(req, res, next) {
    try {
      const order = await PosSaleService.retrieveHeldOrder(req.tenantId, req.params.id, req.user.id);
      return ApiResponse.success(res, { data: order, message: 'Held order retrieved' });
    } catch (error) { next(error); }
  }

  static async listHeldOrders(req, res, next) {
    try {
      const result = await PosSaleService.listHeldOrders(req.tenantId, req.query);
      return ApiResponse.success(res, { data: result.data, pagination: { page: result.page, limit: result.limit, total: result.count, totalPages: result.totalPages } });
    } catch (error) { next(error); }
  }
}

module.exports = PosSaleController;
