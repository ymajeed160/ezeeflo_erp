const { Permission } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');
const { NotFoundError, ConflictError } = require('../utils/appError');

class PermissionRepository extends BaseRepository {
  constructor() { super(Permission); }
}

class PermissionService {
  constructor() { this.repository = new PermissionRepository(); }

  async getAll(companyId, { page, limit, groupName, module }) {
    const filters = {};
    if (groupName) filters.groupName = groupName;
    if (module) filters.module = module;

    return await this.repository.findAndCountAll(companyId, {
      page: parseInt(page) || 1, limit: parseInt(limit) || 500, filters,
    });
  }

  async getGroups(companyId) {
    const permissions = await Permission.findAll({
      where: { companyId },
      attributes: ['groupName'],
      group: ['groupName'],
      order: [['groupName', 'ASC']],
    });
    return permissions.map(p => p.groupName);
  }

  async create(data, companyId) {
    const existing = await Permission.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Permission code already exists');
    return await this.repository.create(data, companyId);
  }

  async update(id, data, companyId) {
    const perm = await Permission.findByPk(id);
    if (!perm || perm.companyId !== companyId) throw new NotFoundError('Permission not found');
    await this.repository.update(id, data, companyId);
    return await Permission.findByPk(id);
  }

  async delete(id, companyId) {
    const perm = await Permission.findByPk(id);
    if (!perm || perm.companyId !== companyId) throw new NotFoundError('Permission not found');
    await this.repository.delete(id, companyId);
  }
}

module.exports = new PermissionService();
