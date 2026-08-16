const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { EmailSetting, UserRole, RefreshToken } = require('../models');
const EmailService = require('./EmailService');
const userRepository = require('../repositories/UserRepository');
const companyRepository = require('../repositories/CompanyRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class UserService {
  async getAllUsers(tenantId, queryParams = {}) {
    const { page = 1, limit = 20, search, isActive, roleId } = queryParams;
    const filters = {};

    // Hide superadmin user from the UI
    filters.username = { [Op.ne]: 'superadmin' };

    if (search) {
      const { Op } = require('sequelize');
      filters[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true' || isActive === true;
    }

    const include = [];
    if (roleId) {
      const { Role } = require('../models');
      include.push({
        model: Role,
        through: { attributes: [] },
        where: { id: roleId },
      });
    } else {
      const { Role } = require('../models');
      include.push({
        model: Role,
        through: { attributes: [] },
      });
    }

    const result = await userRepository.findAndCountAll(tenantId, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
      include,
      order: [['createdAt', 'DESC']],
    });

    return {
      users: result.rows,
      pagination: result.pagination,
    };
  }

  async getUserById(id, tenantId) {
    const user = await userRepository.findByIdWithRoles(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createUser(data, tenantId, userId) {
    // Auto-generate username from email if not provided
    if (!data.username) {
      data.username = data.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    const existingUser = await userRepository.findByEmailOrUsername(
      data.username,
      tenantId
    );

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new ConflictError('Username already exists');
      }
    }

    const emailExisting = await userRepository.findByEmail(data.email, tenantId);
    if (emailExisting && emailExisting.id !== data.id) {
      throw new ConflictError('Email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const plainPassword = data.password; // Keep for email notification

    const userData = {
      ...data,
      password: hashedPassword,
      tenantId,
    };

    delete userData.roles;
    delete userData.roleIds;

    const user = await userRepository.create(userData, tenantId, userId);

    // 🔗 Link the user to the company (UserTenant record) so they can access it on login
    await companyRepository.assignUserToCompany(user.id, tenantId, userId);

    if (data.roleIds && data.roleIds.length > 0) {
      await userRepository.assignRoles(user.id, data.roleIds, tenantId, userId);
    }

    // Send welcome email with credentials
    this.sendWelcomeEmail(tenantId, user, plainPassword);

    return await userRepository.findByIdWithRoles(user.id, tenantId);
  }

  async sendWelcomeEmail(tenantId, user, plainPassword) {
    try {
      const emailSettings = await EmailSetting.findOne({ where: { tenantId } });
      if (!emailSettings || !emailSettings.smtpHost) {
        logger.info(`Welcome email skipped: No SMTP configured for tenant ${tenantId}`);
        return;
      }

      const portalUrl = process.env.APP_URL || 'http://localhost:3001';
      await EmailService.sendWelcomeEmail(emailSettings, {
        to: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        username: user.username,
        tempPassword: plainPassword,
        portalUrl,
      });
    } catch (err) {
      logger.warn(`Welcome email send failed for user ${user.id}: ${err.message}`);
      // Don't throw — email failure should not break user creation
    }
  }

  async updateUser(id, data, tenantId, userId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (data.email && data.email !== user.email) {
      const emailExisting = await userRepository.findByEmail(data.email, tenantId);
      if (emailExisting) {
        throw new ConflictError('Email already exists');
      }
    }

    const updateData = { ...data };
    delete updateData.password;
    delete updateData.roles;
    delete updateData.roleIds;

    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(data.password, salt);
      updateData.lastPasswordChange = new Date();
    }

    await userRepository.update(id, updateData, tenantId, userId);

    if (data.roleIds !== undefined) {
      await userRepository.assignRoles(id, data.roleIds || [], tenantId, userId);
    }

    return await userRepository.findByIdWithRoles(id, tenantId);
  }

  async deleteUser(id, tenantId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Clean up related records before deleting the user
    // 1. Remove user from company (user_tenants)
    await companyRepository.removeUserFromCompany(id, tenantId);

    // 2. Remove user role assignments (user_roles)
    await UserRole.destroy({ where: { userId: id, tenantId } });

    // 3. Remove user refresh tokens (refresh_tokens)
    await RefreshToken.destroy({ where: { userId: id, tenantId } });

    // 4. Delete the user record itself
    await userRepository.delete(id, tenantId, true);
    return true;
  }

  async toggleUserStatus(id, tenantId, userId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newStatus = !user.isActive;
    await userRepository.update(id, { isActive: newStatus }, tenantId, userId);
    return { id, isActive: newStatus };
  }

  async unlockUser(id, tenantId, userId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.update(
      id,
      { isLocked: false, failedLoginAttempts: 0 },
      tenantId,
      userId
    );
    return true;
  }

  async getUserProfile(userId, tenantId) {
    const user = await userRepository.findByIdWithRoles(userId, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const permissions = await userRepository.getUserPermissions(userId, tenantId);
    return { user, permissions };
  }

  async updateProfile(userId, data, tenantId) {
    const user = await userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'language'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    await userRepository.update(userId, updateData, tenantId, userId);
    return await userRepository.findByIdWithRoles(userId, tenantId);
  }
}

module.exports = new UserService();