const accountRepository = require('../repositories/AccountRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class AccountService {
  /**
   * Build a nested tree structure from flat list of accounts
   */
  buildTree(accounts, parentId = null) {
    return accounts
      .filter(a => a.parentAccountId === parentId)
      .map(account => {
        const plain = account.toJSON ? account.toJSON() : account;
        const children = this.buildTree(accounts, plain.id);
        return {
          ...plain,
          children: children.length > 0 ? children : [],
        };
      });
  }

  async getAllAccounts(tenantId, { type, isActive, tree = false, page, limit } = {}) {
    const filters = {};
    if (type) filters.type = type;
    if (isActive !== undefined && isActive !== 'all') filters.isActive = isActive === 'true' || isActive === true;

    if (tree) {
      const accounts = await accountRepository.findAll(tenantId, filters, {
        order: [['code', 'ASC']],
      });
      return this.buildTree(accounts);
    }

    if (page && limit) {
      return await accountRepository.findAndCountAll(tenantId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        filters,
        order: [['code', 'ASC']],
      });
    }

    return await accountRepository.findAll(tenantId, filters, {
      order: [['code', 'ASC']],
    });
  }

  async getAccountById(id, tenantId) {
    const account = await accountRepository.findById(id, tenantId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    return account;
  }

  async getAccountTree(tenantId) {
    const accounts = await accountRepository.findTree(tenantId);
    return this.buildTree(accounts);
  }

  async getRootAccounts(tenantId) {
    return await accountRepository.findRoots(tenantId);
  }

  async getChildAccounts(parentAccountId, tenantId) {
    // Verify parent exists
    const parent = await accountRepository.findById(parentAccountId, tenantId);
    if (!parent) {
      throw new NotFoundError('Parent account not found');
    }
    return await accountRepository.findChildren(parentAccountId, tenantId);
  }

  async getAccountsByType(type, tenantId) {
    return await accountRepository.findByType(type, tenantId);
  }

  async createAccount(data, tenantId, userId) {
    // Validate code uniqueness within tenant
    const existing = await accountRepository.findByCode(data.code, tenantId);
    if (existing) {
      throw new ConflictError(`Account code "${data.code}" already exists in this tenant`);
    }

    // If parentAccountId provided, verify parent exists and is within same tenant
    if (data.parentAccountId) {
      const parent = await accountRepository.findById(data.parentAccountId, tenantId);
      if (!parent) {
        throw new BadRequestError('Parent account not found');
      }
      // Detect circular reference
      if (data.parentAccountId === data.id) {
        throw new BadRequestError('An account cannot be its own parent');
      }
    }

    const account = await accountRepository.create(data, tenantId, userId);
    logger.info(`Account created: ${account.code} (${account.name}) by user ${userId}`);
    return account;
  }

  async updateAccount(id, data, tenantId, userId) {
    const account = await accountRepository.findById(id, tenantId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // If changing code, validate uniqueness
    if (data.code && data.code !== account.code) {
      const existing = await accountRepository.findByCode(data.code, tenantId);
      if (existing) {
        throw new ConflictError(`Account code "${data.code}" already exists`);
      }
    }

    // Prevent circular parent reference
    if (data.parentAccountId) {
      if (data.parentAccountId === id) {
        throw new BadRequestError('An account cannot be its own parent');
      }
      // Check that parent exists
      const parent = await accountRepository.findById(data.parentAccountId, tenantId);
      if (!parent) {
        throw new BadRequestError('Parent account not found');
      }
      // Prevent setting a descendant as parent (circular)
      const descendants = await accountRepository.findWithDescendants(id, tenantId);
      const descendantIds = descendants.map(d => d.id);
      if (descendantIds.includes(data.parentAccountId)) {
        throw new BadRequestError('Cannot set a child account as parent');
      }
    }

    // If parentAccountId is explicitly null, set it
    if (data.parentAccountId === null) {
      data.parentAccountId = null;
    }

    const updated = await accountRepository.update(id, data, tenantId, userId);
    logger.info(`Account updated: ${id} by user ${userId}`);
    return updated;
  }

  async deleteAccount(id, tenantId) {
    const account = await accountRepository.findById(id, tenantId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // Check for children
    const children = await accountRepository.findChildren(id, tenantId);
    if (children.length > 0) {
      throw new BadRequestError('Cannot delete account with child accounts. Remove or reassign children first.');
    }

    await accountRepository.delete(id, tenantId, false);
    logger.info(`Account deleted: ${id} (${account.code}) from tenant ${tenantId}`);
    return true;
  }

  async toggleStatus(id, tenantId, userId) {
    const account = await accountRepository.findById(id, tenantId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const updated = await accountRepository.update(
      id,
      { isActive: !account.isActive },
      tenantId,
      userId
    );
    logger.info(
      `Account ${account.code} ${updated.isActive ? 'activated' : 'deactivated'} by user ${userId}`
    );
    return updated;
  }
}

module.exports = new AccountService();