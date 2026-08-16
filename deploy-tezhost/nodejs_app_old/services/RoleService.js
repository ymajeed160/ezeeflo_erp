const roleRepository = require('../repositories/RoleRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const { Op } = require('sequelize');

class RoleService {
  async getAllRoles(tenantId, queryParams = {}) {
    const { page, limit, search } = queryParams;
    const filters = {};
    // Hide super_admin role from the UI
    filters.code = { [Op.ne]: 'super_admin' };
    if (search) {
      filters[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    const result = await roleRepository.findAndCountAll(tenantId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
      filters,
      order: [['name', 'ASC']],
    });
    return { roles: result.rows, pagination: result.pagination };
  }

  async getRoleById(id, tenantId) {
    const role = await roleRepository.findByIdWithPermissions(id, tenantId);
    if (!role) throw new NotFoundError('Role not found');
    return role;
  }

  async createRole(data, tenantId, userId) {
    const existing = await roleRepository.findByCode(data.code, tenantId);
    if (existing) throw new ConflictError('Role code already exists');
    const role = await roleRepository.create(data, tenantId, userId);
    if (data.permissionIds?.length > 0) {
      await roleRepository.assignPermissions(role.id, data.permissionIds, tenantId, userId);
    }
    return await roleRepository.findByIdWithPermissions(role.id, tenantId);
  }

  async updateRole(id, data, tenantId, userId) {
    const role = await roleRepository.findById(id, tenantId);
    if (!role) throw new NotFoundError('Role not found');
    if (data.code && data.code !== role.code) {
      const existing = await roleRepository.findByCode(data.code, tenantId);
      if (existing) throw new ConflictError('Role code already exists');
    }
    await roleRepository.update(id, data, tenantId, userId);
    if (data.permissionIds !== undefined) {
      await roleRepository.assignPermissions(id, data.permissionIds, tenantId, userId);
    }
    return await roleRepository.findByIdWithPermissions(id, tenantId);
  }

  async deleteRole(id, tenantId) {
    const role = await roleRepository.findById(id, tenantId);
    if (!role) throw new NotFoundError('Role not found');
    if (['super_admin', 'admin', 'user'].includes(role.code)) {
      throw new BadRequestError('Cannot delete system default roles');
    }
    await roleRepository.delete(id, tenantId, true);
    return true;
  }

  async getPermissionsByRole(roleId, tenantId) {
    return await roleRepository.getPermissionsByRole(roleId, tenantId);
  }
}

module.exports = new RoleService();