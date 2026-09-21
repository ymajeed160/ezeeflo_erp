const giftCardService = require('../services/GiftCardService');
const ApiResponse = require('../utils/apiResponse');

class GiftCardController {
  async getAll(req, res, next) {
    try {
      const result = await giftCardService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
  async getById(req, res, next) {
    try { return ApiResponse.success(res, { data: await giftCardService.getById(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
  async purchase(req, res, next) {
    try { return ApiResponse.created(res, { data: await giftCardService.purchase(req.body, req.user.companyId), message: 'Gift card purchased' }); } catch (error) { next(error); }
  }
  async redeem(req, res, next) {
    try {
      const result = await giftCardService.redeem(req.body.cardNumber, req.body.amount, req.user.companyId, { orderReference: req.body.orderReference, customerId: req.body.customerId, createdBy: req.user.id });
      return ApiResponse.success(res, { data: result, message: `AED ${result.redeemedAmount.toFixed(2)} redeemed` });
    } catch (error) { next(error); }
  }
  async recharge(req, res, next) {
    try {
      const result = await giftCardService.recharge(req.body.cardNumber, req.body.amount, req.user.companyId, { notes: req.body.notes, createdBy: req.user.id });
      return ApiResponse.success(res, { data: result, message: `Recharged AED ${result.rechargeAmount.toFixed(2)}` });
    } catch (error) { next(error); }
  }
  async cancel(req, res, next) {
    try {
      const result = await giftCardService.cancel(req.body.cardNumber, req.user.companyId, { notes: req.body.notes, createdBy: req.user.id });
      return ApiResponse.success(res, { data: result, message: 'Gift card canceled' });
    } catch (error) { next(error); }
  }
  async getTransactions(req, res, next) {
    try { return ApiResponse.success(res, { data: await giftCardService.getTransactionHistory(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
}

module.exports = new GiftCardController();
