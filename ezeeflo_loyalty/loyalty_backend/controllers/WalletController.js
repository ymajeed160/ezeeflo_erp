const walletService = require('../services/WalletService');
const ApiResponse = require('../utils/apiResponse');

class WalletController {
  async getCustomerWallet(req, res, next) {
    try {
      const customerId = req.params.customerId || req.query.customerId;
      if (!customerId) return ApiResponse.badRequest(res, { message: 'customerId is required' });
      const wallet = await walletService.getWallet(customerId, req.user.companyId);
      return ApiResponse.success(res, { data: wallet });
    } catch (error) { next(error); }
  }

  async getWalletsSummary(req, res, next) {
    try {
      const result = await walletService.getWalletsSummary(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
}

module.exports = new WalletController();
