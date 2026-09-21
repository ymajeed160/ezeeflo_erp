const { Role, Permission, User } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');
const { NotFoundError, ConflictError } = require('../utils/appError');

class RoleRepository extends BaseRepository {
  constructor() { super(Role); }

  async findWithPermissions(roleId, companyId) {
    const role = await this.model.findOne({
      where: { id: roleId, companyId },
      include: [
        { model: Permission, as: 'permissions', through: { attributes: [] } },
        { model: User, as: 'users', through: { attributes: [] }, attributes: ['id', 'username', 'firstName', 'lastName'] },
      ],
    });
    if (!role) throw new NotFoundError('Role not found');
    return role;
  }
}

class RoleService {
  constructor() { this.repository = new RoleRepository(); }

  async getAll(companyId, { page, limit, isActive }) {
    const filters = {};
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      filters.isActive = isActive === 'true' || isActive === true;
    }
    return await this.repository.findAndCountAll(companyId, {
      page: parseInt(page) || 1, limit: parseInt(limit) || 100, filters,
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
  }

  async getById(roleId, companyId) {
    return await this.repository.findWithPermissions(roleId, companyId);
  }

  async create(data, companyId) {
    const existing = await Role.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Role code already exists');

    const role = await this.repository.create(data, companyId);
    if (data.permissionIds?.length) {
      const permissions = await Permission.findAll({ where: { id: data.permissionIds, companyId } });
      await role.setPermissions(permissions);
    }
    return await this.repository.findWithPermissions(role.id, companyId);
  }

  async update(roleId, data, companyId) {
    const role = await Role.findByPk(roleId);
    if (!role || role.companyId !== companyId) throw new NotFoundError('Role not found');

    await this.repository.update(roleId, data, companyId);
    if (data.permissionIds) {
      const permissions = await Permission.findAll({ where: { id: data.permissionIds, companyId } });
      await role.setPermissions(permissions);
    }
    return await this.repository.findWithPermissions(roleId, companyId);
  }

  async delete(roleId, companyId) {
    const role = await Role.findByPk(roleId);
    if (!role || role.companyId !== companyId) throw new NotFoundError('Role not found');
    if (role.isSystem) throw new ConflictError('Cannot delete system roles');
    await this.repository.delete(roleId, companyId);
  }

  async assignPermissions(roleId, permissionIds, companyId) {
    const role = await Role.findByPk(roleId);
    if (!role || role.companyId !== companyId) throw new NotFoundError('Role not found');
    const permissions = await Permission.findAll({ where: { id: permissionIds, companyId } });
    await role.setPermissions(permissions);
    return await this.repository.findWithPermissions(roleId, companyId);
  }
}

module.exports = new RoleService();
