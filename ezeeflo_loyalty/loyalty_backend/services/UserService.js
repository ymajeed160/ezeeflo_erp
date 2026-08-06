const { User, Company, Role, Permission } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByUsername(username, companyId) {
    return await this.model.findOne({
      where: { username, companyId },
      include: [
        { model: Role, as: 'roles', through: { attributes: [] } },
      ],
    });
  }

  async findWithRoles(userId, companyId) {
    const user = await this.model.findByPk(userId, {
      where: { companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'code'] },
        {
          model: Role, as: 'roles',
          through: { attributes: [] },
          include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
        },
      ],
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  async getAll(companyId, { page, limit, search, isActive, roleId }) {
    const filters = {};
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      filters.isActive = isActive === 'true' || isActive === true;
    }
    if (search) {
      filters[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const include = [
      { model: Role, as: 'roles', through: { attributes: [] }, required: !!roleId, where: roleId ? { id: roleId } : undefined },
    ];

    const result = await this.repository.findAndCountAll(companyId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      filters,
      include,
      attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken'] },
    });

    return result;
  }

  async getById(userId, companyId) {
    return await this.repository.findWithRoles(userId, companyId);
  }

  async create(data, companyId, createdBy) {
    const existing = await User.findOne({
      where: { [Op.or]: [{ username: data.username }, { email: data.email }] },
    });
    if (existing) {
      throw new ConflictError(existing.username === data.username ? 'Username already exists' : 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password || 'Welcome@123', 12);
    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
      companyId,
    }, companyId, createdBy);

    // Assign roles
    if (data.roleIds?.length) {
      const roles = await Role.findAll({ where: { id: data.roleIds, companyId } });
      await user.setRoles(roles);
    }

    return await this.repository.findWithRoles(user.id, companyId);
  }

  async update(userId, data, companyId, updatedBy) {
    const user = await User.findByPk(userId);
    if (!user || user.companyId !== companyId) throw new NotFoundError('User not found');

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    await this.repository.update(userId, data, companyId, updatedBy);

    if (data.roleIds) {
      const roles = await Role.findAll({ where: { id: data.roleIds, companyId } });
      await user.setRoles(roles);
    }

    return await this.repository.findWithRoles(userId, companyId);
  }

  async delete(userId, companyId) {
    const user = await User.findByPk(userId);
    if (!user || user.companyId !== companyId) throw new NotFoundError('User not found');
    await this.repository.delete(userId, companyId);
  }

  async toggleStatus(userId, companyId) {
    const user = await User.findByPk(userId);
    if (!user || user.companyId !== companyId) throw new NotFoundError('User not found');
    user.isActive = !user.isActive;
    await user.save();
    return user;
  }
}

module.exports = new UserService();
