const BaseRepository = require('./BaseRepository');
const { Role, Permission, RolePermission, User } = require('../models');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findAndCountAll(tenantId, options = {}) {
    const { User, Permission } = require('../models');
    const userInclude = {
      model: User,
      through: { attributes: [] },
      attributes: ['id'],
      required: false,
    };
    const permInclude = {
      model: Permission,
      through: { attributes: [] },
      required: false,
    };
    const include = [...(options.include || []), userInclude, permInclude];
    return await super.findAndCountAll(tenantId, { ...options, include });
  }

  async findByCode(code, tenantId) {
    return await Role.findOne({ where: { code, tenantId } });
  }

  async findByIdWithPermissions(id, tenantId) {
    return await Role.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async assignPermissions(roleId, permissionIds, tenantId, userId) {
    await RolePermission.destroy({ where: { roleId, tenantId } });
    const records = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    }));
    return await RolePermission.bulkCreate(records);
  }

  async getPermissionsByRole(roleId, tenantId) {
    const role = await Role.findOne({
      where: { id: roleId, tenantId },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
    return role?.Permissions || [];
  }
}

module.exports = new RoleRepository();