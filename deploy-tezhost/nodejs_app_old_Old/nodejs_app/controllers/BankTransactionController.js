const bankTransactionService = require('../services/BankTransactionService');
const BankTransactionDTO = require('../dto/BankTransactionDTO');
const ApiResponse = require('../utils/apiResponse');

class BankTransactionController {
  async getTransactions(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await bankTransactionService.getTransactions(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: BankTransactionDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Bank transactions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const txn = await bankTransactionService.getTransactionById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: BankTransactionDTO.toResponse(txn),
        message: 'Bank transaction retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const txn = await bankTransactionService.createTransaction(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: BankTransactionDTO.toResponse(txn),
        message: 'Bank transaction created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTransaction(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const txn = await bankTransactionService.updateTransaction(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankTransactionDTO.toResponse(txn),
        message: 'Bank transaction updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async postTransaction(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const txn = await bankTransactionService.postTransaction(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankTransactionDTO.toResponse(txn),
        message: 'Bank transaction posted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async reverseTransaction(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const txn = await bankTransactionService.reverseTransaction(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankTransactionDTO.toResponse(txn),
        message: 'Bank transaction reversed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await bankTransactionService.deleteTransaction(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Bank transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreconciledTransactions(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { bankAccountId } = req.query;
      if (!bankAccountId) {
        return ApiResponse.badRequest(res, { message: 'bankAccountId is required' });
      }
      const txns = await bankTransactionService.getUnreconciledTransactions(bankAccountId, tenantId);
      return ApiResponse.success(res, {
        data: BankTransactionDTO.toListResponse(txns),
        message: 'Unreconciled transactions retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async importCSV(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const txns = await bankTransactionService.importCSV(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: BankTransactionDTO.toListResponse(txns),
        message: `${txns.length} transactions imported successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BankTransactionController();
