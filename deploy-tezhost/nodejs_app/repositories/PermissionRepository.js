const BaseRepository = require('./BaseRepository');
const { Permission, Role, RolePermission } = require('../models');

class PermissionRepository extends BaseRepository {
  constructor() {
    super(Permission);
  }

  async findByCode(code, tenantId) {
    return await Permission.findOne({ where: { code, tenantId } });
  }

  async findByModule(module, tenantId) {
    return await Permission.findAll({ where: { module, tenantId } });
  }

  async findPermissionsByRoleIds(roleIds, tenantId) {
    return await Permission.findAll({
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { id: roleIds, tenantId, isActive: true },
        },
      ],
      where: { isActive: true },
    });
  }

  async seedDefaultPermissions(permissions, tenantId, userId) {
    const records = permissions.map(p => ({
      ...p,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    }));
    return await Permission.bulkCreate(records, {
      ignoreDuplicates: true,
    });
  }
}

module.exports = new PermissionRepository();