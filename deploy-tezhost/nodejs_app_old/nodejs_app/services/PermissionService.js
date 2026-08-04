const permissionRepository = require('../repositories/PermissionRepository');
const { NotFoundError } = require('../utils/appError');

class PermissionService {
  async getAllPermissions(tenantId, queryParams = {}) {
    const { module: moduleFilter, search } = queryParams;
    const filters = {};
    if (moduleFilter) filters.module = moduleFilter;
    if (search) {
      const { Op } = require('sequelize');
      filters[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    const result = await permissionRepository.findAndCountAll(tenantId, {
      page: 1, limit: 500, filters, order: [['module', 'ASC'], ['name', 'ASC']],
    });
    return { permissions: result.rows, pagination: result.pagination };
  }

  async getPermissionsByModule(module, tenantId) {
    return await permissionRepository.findByModule(module, tenantId);
  }

  async getModuleList(tenantId) {
    const result = await permissionRepository.findAll(tenantId, {}, {
      attributes: ['module'],
      group: ['module'],
      order: [['module', 'ASC']],
    });
    return result.map(r => r.module);
  }
}

module.exports = new PermissionService();