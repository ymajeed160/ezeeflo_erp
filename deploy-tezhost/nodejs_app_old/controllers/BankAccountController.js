const bankAccountService = require('../services/BankAccountService');
const BankAccountDTO = require('../dto/BankAccountDTO');
const ApiResponse = require('../utils/apiResponse');

class BankAccountController {
  async getBankAccounts(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await bankAccountService.getBankAccounts(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: BankAccountDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Bank accounts retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getBankAccountById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const bankAccount = await bankAccountService.getBankAccountById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: BankAccountDTO.toResponse(bankAccount),
        message: 'Bank account retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveBankAccounts(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const bankAccounts = await bankAccountService.getActiveBankAccounts(tenantId);
      return ApiResponse.success(res, {
        data: BankAccountDTO.toCompactListResponse(bankAccounts),
        message: 'Active bank accounts retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createBankAccount(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const bankAccount = await bankAccountService.createBankAccount(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: BankAccountDTO.toResponse(bankAccount),
        message: 'Bank account created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBankAccount(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const bankAccount = await bankAccountService.updateBankAccount(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankAccountDTO.toResponse(bankAccount),
        message: 'Bank account updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleBankAccountStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const bankAccount = await bankAccountService.toggleStatus(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankAccountDTO.toResponse(bankAccount),
        message: `Bank account ${bankAccount.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultBankAccount(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const bankAccount = await bankAccountService.setDefault(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: BankAccountDTO.toResponse(bankAccount),
        message: 'Bank account set as default successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBankAccount(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await bankAccountService.deleteBankAccount(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Bank account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BankAccountController();
