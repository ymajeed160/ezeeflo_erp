const couponService = require('../services/CouponService');
const ApiResponse = require('../utils/apiResponse');

class CouponController {
  async getAll(req, res, next) {
    try {
      const result = await couponService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
  async getById(req, res, next) {
    try { return ApiResponse.success(res, { data: await couponService.getById(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
  async generate(req, res, next) {
    try {
      const coupons = await couponService.generate(req.body, req.user.companyId);
      return ApiResponse.created(res, { data: coupons, message: `${coupons.length} coupon(s) generated` });
    } catch (error) { next(error); }
  }
  async update(req, res, next) {
    try { return ApiResponse.success(res, { data: await couponService.update(req.params.id, req.body, req.user.companyId) }); } catch (error) { next(error); }
  }
  async delete(req, res, next) {
    try { await couponService.delete(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Coupon deleted' }); } catch (error) { next(error); }
  }
  async toggleStatus(req, res, next) {
    try { return ApiResponse.success(res, { data: await couponService.toggleStatus(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
  async validate(req, res, next) {
    try {
      const result = await couponService.validateCoupon(req.body.code, req.body.customerId, req.user.companyId, { orderAmount: req.body.orderAmount || 0 });
      return ApiResponse.success(res, { data: result, message: 'Coupon is valid' });
    } catch (error) { next(error); }
  }
  async redeem(req, res, next) {
    try {
      const result = await couponService.redeemCoupon(req.body.code, req.body.customerId, req.user.companyId, { orderAmount: req.body.orderAmount || 0, orderReference: req.body.orderReference });
      return ApiResponse.success(res, { data: result, message: 'Coupon redeemed successfully' });
    } catch (error) { next(error); }
  }
  async getUsageHistory(req, res, next) {
    try {
      const result = await couponService.getUsageHistory(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
}

module.exports = new CouponController();
