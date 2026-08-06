const pointsEngine = require('../services/PointsEngineService');
const transactionService = require('../services/TransactionService');
const ApiResponse = require('../utils/apiResponse');

class PointsController {
  // === EARN ===
  async earn(req, res, next) {
    try {
      const result = await pointsEngine.earnPoints({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      return ApiResponse.created(res, { data: result, message: `${result.transaction.points} points earned` });
    } catch (error) { next(error); }
  }

  // === REDEEM ===
  async redeem(req, res, next) {
    try {
      const result = await pointsEngine.redeemPoints({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      return ApiResponse.success(res, { data: result, message: `${Math.abs(result.transaction.points)} points redeemed` });
    } catch (error) { next(error); }
  }

  // === REVERSE ===
  async reverse(req, res, next) {
    try {
      const result = await pointsEngine.reverseTransaction({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      return ApiResponse.success(res, { data: result, message: 'Transaction reversed' });
    } catch (error) { next(error); }
  }

  // === ADJUST ===
  async adjust(req, res, next) {
    try {
      const result = await pointsEngine.adjustPoints({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      const action = req.body.points > 0 ? 'added' : 'deducted';
      return ApiResponse.success(res, { data: result, message: `${Math.abs(req.body.points)} points ${action}` });
    } catch (error) { next(error); }
  }

  // === TRANSFER ===
  async transfer(req, res, next) {
    try {
      const result = await pointsEngine.transferPoints({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      });
      return ApiResponse.success(res, { data: result, message: `${req.body.points} points transferred` });
    } catch (error) { next(error); }
  }

  // === CALCULATE ===
  async calculate(req, res, next) {
    try {
      const { customerId, purchaseAmount, campaignId, storeId, productCategory } = req.query;
      const result = await pointsEngine.calculateEarnablePoints(
        req.user.companyId, customerId, parseFloat(purchaseAmount) || 0, { campaignId, storeId, productCategory }
      );
      return ApiResponse.success(res, { data: result });
    } catch (error) { next(error); }
  }

  // === EXPIRE (admin-only scheduled job) ===
  async expire(req, res, next) {
    try {
      const result = await pointsEngine.expirePoints(req.user.companyId);
      return ApiResponse.success(res, { data: result, message: `${result.expiredCount} accounts processed` });
    } catch (error) { next(error); }
  }

  // === WELCOME BONUS ===
  async welcomeBonus(req, res, next) {
    try {
      const { customerId, bonusPoints } = req.body;
      const result = await pointsEngine.grantWelcomeBonus(customerId, req.user.companyId, bonusPoints);
      return ApiResponse.success(res, { data: result, message: `Welcome bonus of ${bonusPoints || 100} points granted` });
    } catch (error) { next(error); }
  }

  // === BIRTHDAY BONUS ===
  async birthdayBonus(req, res, next) {
    try {
      const { customerId, bonusPoints } = req.body;
      const result = await pointsEngine.grantBirthdayBonus(customerId, req.user.companyId, bonusPoints);
      return ApiResponse.success(res, { data: result, message: `Birthday bonus of ${bonusPoints || 50} points granted` });
    } catch (error) { next(error); }
  }
}

class TransactionController {
  async getAll(req, res, next) {
    try {
      const result = await transactionService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const txn = await transactionService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: txn });
    } catch (error) { next(error); }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await transactionService.getSummary(req.user.companyId, req.query);
      return ApiResponse.success(res, { data: summary });
    } catch (error) { next(error); }
  }

  async getCustomerTransactions(req, res, next) {
    try {
      const result = await transactionService.getCustomerTransactions(req.params.customerId, req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
}

module.exports = { PointsController: new PointsController(), TransactionController: new TransactionController() };
