const accountService = require('../services/AccountService');
const ApiResponse = require('../utils/apiResponse');

class AccountController {
  async getAll(req, res, next) {
    try {
      const { type, isActive, tree, page, limit } = req.query;
      const result = await accountService.getAllAccounts(req.user.tenantId, {
        type,
        isActive,
        tree,
        page,
        limit,
      });

      if (page && limit && !tree) {
        return ApiResponse.paginated(res, {
          data: result.rows,
          pagination: result.pagination,
        });
      }

      return ApiResponse.success(res, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const account = await accountService.getAccountById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: account });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await accountService.getAccountTree(req.user.tenantId);
      return ApiResponse.success(res, { data: tree });
    } catch (error) {
      next(error);
    }
  }

  async getRoots(req, res, next) {
    try {
      const roots = await accountService.getRootAccounts(req.user.tenantId);
      return ApiResponse.success(res, { data: roots });
    } catch (error) {
      next(error);
    }
  }

  async getChildren(req, res, next) {
    try {
      const children = await accountService.getChildAccounts(
        req.params.parentId,
        req.user.tenantId
      );
      return ApiResponse.success(res, { data: children });
    } catch (error) {
      next(error);
    }
  }

  async getByType(req, res, next) {
    try {
      const accounts = await accountService.getAccountsByType(
        req.params.type,
        req.user.tenantId
      );
      return ApiResponse.success(res, { data: accounts });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const account = await accountService.createAccount(
        req.body,
        req.user.tenantId,
        req.user.id
      );
      return ApiResponse.created(res, {
        data: account,
        message: 'Account created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const account = await accountService.updateAccount(
        req.params.id,
        req.body,
        req.user.tenantId,
        req.user.id
      );
      return ApiResponse.success(res, {
        data: account,
        message: 'Account updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await accountService.deleteAccount(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const account = await accountService.toggleStatus(
        req.params.id,
        req.user.tenantId,
        req.user.id
      );
      return ApiResponse.success(res, {
        data: account,
        message: `Account ${account.isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();