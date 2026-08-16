const BaseRepository = require('./BaseRepository');
const { User, Role, Permission, UserRole } = require('../models');
const { Op } = require('sequelize');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByUsername(username, tenantId = null) {
    const where = { username };
    if (tenantId) where.tenantId = tenantId;
    return await User.scope('withPassword').findOne({ where });
  }

  async findById(id, tenantId = null, options = {}) {
    const { scope, ...restOptions } = options;
    const where = { id };
    if (tenantId) where.tenantId = tenantId;
    let query = User.scope(scope || 'withPassword');
    return await query.findOne({ where, ...restOptions });
  }

  async findByEmail(email, tenantId = null) {
    const where = { email };
    if (tenantId) where.tenantId = tenantId;
    return await User.scope('withPassword').findOne({ where });
  }

  async findByEmailOrUsername(identifier, tenantId = null) {
    const where = {
      [Op.or]: [{ email: identifier }, { username: identifier }],
    };
    if (tenantId) where.tenantId = tenantId;
    return await User.scope('withPassword').findOne({ where });
  }

  async findByIdWithRoles(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.tenantId = tenantId;
    return await User.findOne({
      where,
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
  }

  async findByResetToken(token) {
    return await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });
  }

  async updateRefreshToken(id, refreshToken) {
    return await User.update({ refreshToken }, { where: { id } });
  }

  async incrementFailedAttempts(id) {
    const user = await User.scope('withPassword').findByPk(id);
    if (user) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();
    }
    return user;
  }

  async resetFailedAttempts(id) {
    return await User.update(
      { failedLoginAttempts: 0, isLocked: false },
      { where: { id } }
    );
  }

  async updateLastLogin(id) {
    return await User.update(
      { lastLogin: new Date(), failedLoginAttempts: 0 },
      { where: { id } }
    );
  }

  async assignRoles(userId, roleIds, tenantId, userId_op) {
    await UserRole.destroy({ where: { userId, tenantId } });
    const records = roleIds.map(roleId => ({
      userId,
      roleId,
      tenantId,
      createdBy: userId_op,
      updatedBy: userId_op,
    }));
    return await UserRole.bulkCreate(records);
  }

  async getUserPermissions(userId, tenantId) {
    const user = await User.findOne({
      where: { id: userId, tenantId },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { isActive: true },
          include: [
            {
              model: Permission,
              through: { attributes: [] },
              where: { isActive: true },
            },
          ],
        },
      ],
    });
    const permissions = [];
    if (user?.Roles) {
      user.Roles.forEach(role => {
        if (role.Permissions) {
          role.Permissions.forEach(perm => {
            if (!permissions.find(p => p.code === perm.code)) {
              permissions.push({
                id: perm.id,
                code: perm.code,
                name: perm.name,
                module: perm.module,
              });
            }
          });
        }
      });
    }
    return permissions;
  }
}

module.exports = new UserRepository();