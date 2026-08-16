const bankAccountRepository = require('../repositories/BankAccountRepository');
const { Account, sequelize } = require('../models');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

class BankAccountService {
  async getBankAccounts(tenantId, query = {}) {
    const { page = 1, limit = 20, isActive, search, currencyCode } = query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;
    if (currencyCode) filters.currencyCode = currencyCode;
    return await bankAccountRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      filters,
      search,
      order: [['accountCode', 'ASC']],
    });
  }

  async getBankAccountById(id, tenantId) {
    const bankAccount = await bankAccountRepository.findById(id, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');
    return bankAccount;
  }

  async getActiveBankAccounts(tenantId) {
    return await bankAccountRepository.findActive(tenantId);
  }

  async createBankAccount(data, tenantId, userId) {
    // Check unique account code
    const existingByCode = await bankAccountRepository.findByCode(data.accountCode, tenantId);
    if (existingByCode) {
      throw new ConflictError(`Bank account code "${data.accountCode}" already exists`);
    }

    // Check unique account number if provided
    if (data.accountNumber) {
      const existingByNumber = await bankAccountRepository.findByAccountNumber(data.accountNumber, tenantId);
      if (existingByNumber) {
        throw new ConflictError(`Bank account number "${data.accountNumber}" already exists`);
      }
    }

    // Validate chart of account exists and is active
    const coaAccount = await Account.findOne({
      where: { id: data.chartOfAccountId, tenantId, isActive: true },
    });
    if (!coaAccount) {
      throw new BadRequestError('Chart of account not found or is inactive for this tenant');
    }

    // Validate account type is compatible (asset/bank/cash)
    const compatibleTypes = ['asset'];
    if (!compatibleTypes.includes(coaAccount.type)) {
      throw new BadRequestError(
        `Chart of account type must be "asset". Selected account type is "${coaAccount.type}". Bank accounts must be linked to an asset account.`
      );
    }

    // Use transaction for creation
    const result = await sequelize.transaction(async (transaction) => {
      // If isDefault is true, clear other defaults for same currency
      if (data.isDefault) {
        await bankAccountRepository.clearDefaultFlag(tenantId, data.currencyCode || 'USD', null);
      }

      const bankAccount = await bankAccountRepository.create(data, tenantId, userId);
      logger.info(`Bank account created: ${bankAccount.accountCode} - ${bankAccount.accountName} in tenant ${tenantId}`);
      return bankAccount;
    });

    return await bankAccountRepository.findById(result.id, tenantId);
  }

  async updateBankAccount(id, data, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(id, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    // Check unique account code if changing
    if (data.accountCode && data.accountCode !== bankAccount.accountCode) {
      const existingByCode = await bankAccountRepository.findByCode(data.accountCode, tenantId);
      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictError(`Bank account code "${data.accountCode}" already exists`);
      }
    }

    // Check unique account number if changing
    if (data.accountNumber && data.accountNumber !== bankAccount.accountNumber) {
      const existingByNumber = await bankAccountRepository.findByAccountNumber(data.accountNumber, tenantId);
      if (existingByNumber && existingByNumber.id !== id) {
        throw new ConflictError(`Bank account number "${data.accountNumber}" already exists`);
      }
    }

    // Validate chart of account if changing
    if (data.chartOfAccountId && data.chartOfAccountId !== bankAccount.chartOfAccountId) {
      const coaAccount = await Account.findOne({
        where: { id: data.chartOfAccountId, tenantId, isActive: true },
      });
      if (!coaAccount) {
        throw new BadRequestError('Chart of account not found or is inactive');
      }
      if (coaAccount.type !== 'asset') {
        throw new BadRequestError('Chart of account must be of type "asset"');
      }
    }

    // Prevent opening balance change after transactions exist
    if (data.openingBalance !== undefined && parseFloat(data.openingBalance) !== parseFloat(bankAccount.openingBalance)) {
      // Check if any transactions exist - will be implemented when bank transactions module is added
      // For now, allow opening balance changes
    }

    // Use transaction for update
    const result = await sequelize.transaction(async (transaction) => {
      // If setting as default, clear other defaults for same currency
      if (data.isDefault) {
        await bankAccountRepository.clearDefaultFlag(
          tenantId,
          data.currencyCode || bankAccount.currencyCode,
          id
        );
      }

      const updated = await bankAccountRepository.update(id, data, tenantId, userId);
      return updated;
    });

    if (!result) throw new NotFoundError('Bank account not found after update');
    return await bankAccountRepository.findById(result.id, tenantId);
  }

  async toggleStatus(id, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(id, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    const updated = await bankAccountRepository.update(
      id,
      { isActive: !bankAccount.isActive },
      tenantId,
      userId
    );
    if (!updated) throw new NotFoundError('Bank account not found after toggle');
    return await bankAccountRepository.findById(id, tenantId);
  }

  async setDefault(id, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(id, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    const result = await sequelize.transaction(async (transaction) => {
      await bankAccountRepository.clearDefaultFlag(tenantId, bankAccount.currencyCode, id);
      const updated = await bankAccountRepository.update(
        id,
        { isDefault: true },
        tenantId,
        userId
      );
      return updated;
    });

    if (!result) throw new NotFoundError('Bank account not found after update');
    return await bankAccountRepository.findById(id, tenantId);
  }

  async deleteBankAccount(id, tenantId) {
    const bankAccount = await bankAccountRepository.findById(id, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    // Prevent deletion if this is the default account
    if (bankAccount.isDefault) {
      throw new BadRequestError('Cannot delete the default bank account. Set another account as default first.');
    }

    await bankAccountRepository.delete(id, tenantId, false);
    logger.info(`Bank account deleted: ${bankAccount.accountCode} in tenant ${tenantId}`);
    return true;
  }
}

module.exports = new BankAccountService();
