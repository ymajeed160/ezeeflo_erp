const BaseRepository = require('./BaseRepository');
const { Account } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AccountRepository extends BaseRepository {
  constructor() {
    super(Account);
  }

  async findByCode(code, tenantId) {
    const where = { code, tenantId };
    return await this.model.findOne({ where });
  }

  async findChildren(parentAccountId, tenantId) {
    return await this.model.findAll({
      where: { parentAccountId, tenantId },
      order: [['code', 'ASC']],
    });
  }

  async findRoots(tenantId) {
    return await this.model.findAll({
      where: { parentAccountId: null, tenantId },
      order: [['code', 'ASC']],
    });
  }

  async findTree(tenantId) {
    const accounts = await this.model.findAll({
      where: { tenantId },
      order: [['code', 'ASC']],
    });
    return accounts;
  }

  async findByType(type, tenantId) {
    return await this.model.findAll({
      where: { type, tenantId },
      order: [['code', 'ASC']],
    });
  }

  async findWithDescendants(parentAccountId, tenantId) {
    const allAccounts = await this.model.findAll({
      where: { tenantId },
      attributes: ['id', 'parentAccountId', 'name', 'code', 'type', 'isActive'],
    });

    const descendantIds = this._collectDescendantIds(allAccounts, parentAccountId);
    return allAccounts.filter(a => descendantIds.has(a.id));
  }

  _collectDescendantIds(accounts, parentId, collected = new Set()) {
    const children = accounts.filter(a => a.parentAccountId === parentId);
    children.forEach(child => {
      collected.add(child.id);
      this._collectDescendantIds(accounts, child.id, collected);
    });
    return collected;
  }
}

module.exports = new AccountRepository();