const paymentVoucherService = require('../services/PaymentVoucherService');
const PaymentVoucherDTO = require('../dto/PaymentVoucherDTO');
const ApiResponse = require('../utils/apiResponse');

class PaymentVoucherController {
  async getVouchers(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await paymentVoucherService.getVouchers(tenantId, req.query);
      return ApiResponse.paginated(res, { data: PaymentVoucherDTO.toListResponse(result.rows), pagination: result.pagination, message: 'Payment vouchers retrieved' });
    } catch (e) { next(e); }
  }
  async getVoucherById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const voucher = await paymentVoucherService.getVoucherById(req.params.id, tenantId);
      return ApiResponse.success(res, { data: PaymentVoucherDTO.toResponse(voucher), message: 'Payment voucher retrieved' });
    } catch (e) { next(e); }
  }
  async getInvoicesForAllocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { supplierId, excludeVoucherId } = req.query;
      if (!supplierId) return ApiResponse.badRequest(res, { message: 'supplierId is required' });
      const invoices = await paymentVoucherService.getInvoicesForAllocation(tenantId, supplierId, excludeVoucherId);
      return ApiResponse.success(res, { data: invoices, message: 'Invoices retrieved' });
    } catch (e) { next(e); }
  }
  async createVoucher(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const voucher = await paymentVoucherService.createVoucher(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: PaymentVoucherDTO.toResponse(voucher), message: 'Payment voucher created' });
    } catch (e) { next(e); }
  }
  async updateVoucher(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const voucher = await paymentVoucherService.updateVoucher(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentVoucherDTO.toResponse(voucher), message: 'Payment voucher updated' });
    } catch (e) { next(e); }
  }
  async postVoucher(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const voucher = await paymentVoucherService.postVoucher(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentVoucherDTO.toResponse(voucher), message: 'Payment voucher posted' });
    } catch (e) { next(e); }
  }
  async reverseVoucher(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const voucher = await paymentVoucherService.reverseVoucher(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: PaymentVoucherDTO.toResponse(voucher), message: 'Payment voucher reversed' });
    } catch (e) { next(e); }
  }
  async deleteVoucher(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await paymentVoucherService.deleteVoucher(req.params.id, tenantId);
      return ApiResponse.success(res, { message: 'Payment voucher deleted' });
    } catch (e) { next(e); }
  }
}
module.exports = new PaymentVoucherController();
