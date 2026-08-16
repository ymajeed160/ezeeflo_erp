const paymentReceiptService = require('../services/PaymentReceiptService');
const PaymentReceiptDTO = require('../dto/PaymentReceiptDTO');
const ApiResponse = require('../utils/apiResponse');

class PaymentReceiptController {
  async getReceipts(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await paymentReceiptService.getReceipts(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: PaymentReceiptDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Payment receipts retrieved successfully',
      });
    } catch (error) { next(error); }
  }

  async getReceiptById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const receipt = await paymentReceiptService.getReceiptById(req.params.id, tenantId);
      return ApiResponse.success(res, { data: PaymentReceiptDTO.toResponse(receipt), message: 'Payment receipt retrieved' });
    } catch (error) { next(error); }
  }

  async getInvoicesForAllocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { customerId, excludeReceiptId } = req.query;
      if (!customerId) return ApiResponse.badRequest(res, { message: 'customerId is required' });
      const invoices = await paymentReceiptService.getInvoicesForAllocation(tenantId, customerId, excludeReceiptId);
      return ApiResponse.success(res, { data: invoices, message: 'Invoices retrieved for allocation' });
    } catch (error) { next(error); }
  }

  async createReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const receipt = await paymentReceiptService.createReceipt(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: PaymentReceiptDTO.toResponse(receipt), message: 'Payment receipt created' });
    } catch (error) { next(error); }
  }

  async updateReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const receipt = await paymentReceiptService.updateReceipt(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentReceiptDTO.toResponse(receipt), message: 'Payment receipt updated' });
    } catch (error) { next(error); }
  }

  async postReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const receipt = await paymentReceiptService.postReceipt(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentReceiptDTO.toResponse(receipt), message: 'Payment receipt posted' });
    } catch (error) { next(error); }
  }

  async reverseReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const receipt = await paymentReceiptService.reverseReceipt(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentReceiptDTO.toResponse(receipt), message: 'Payment receipt reversed' });
    } catch (error) { next(error); }
  }

  async deleteReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await paymentReceiptService.deleteReceipt(req.params.id, tenantId);
      return ApiResponse.success(res, { message: 'Payment receipt deleted' });
    } catch (error) { next(error); }
  }
}

module.exports = new PaymentReceiptController();
