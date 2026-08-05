const { Op } = require('sequelize');
const { User, UserCompany } = require('../models');
const bcrypt = require('bcryptjs');

class UserRepository {
  async findAll({ query = {} }) {
    const { page = 1, limit = 10, search = '', role, isActive } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: UserCompany, as: 'companies', required: false }],
      order: [['createdAt', 'DESC']],
      offset, limit: parseInt(limit),
      distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) } };
  }

  async findById(id) {
    return User.findByPk(id, { include: [{ model: UserCompany, as: 'companies', required: false }] });
  }

  async findByEmail(email) {
    return User.unscoped().findOne({ where: { email }, include: [{ model: UserCompany, as: 'companies', required: false }] });
  }

  async findByUsername(username) {
    return User.unscoped().findOne({ where: { username }, include: [{ model: UserCompany, as: 'companies', required: false }] });
  }

  async create(data) {
    if (data.password) data.password = await bcrypt.hash(data.password, 12);
    const user = await User.create(data);
    // Create company associations
    if (data.companyIds && data.companyIds.length > 0) {
      const companies = data.companyIds.map((cid, i) => ({ userId: user.id, companyId: cid, isDefault: i === 0 }));
      await UserCompany.bulkCreate(companies);
    }
    return this.findByEmail(data.email);
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    if (data.password) data.password = await bcrypt.hash(data.password, 12);
    await user.update(data);
    // Update company associations
    if (data.companyIds !== undefined) {
      await UserCompany.destroy({ where: { userId: id }, force: true });
      if (data.companyIds.length > 0) {
        const companies = data.companyIds.map((cid, i) => ({ userId: id, companyId: cid, isDefault: i === 0 }));
        await UserCompany.bulkCreate(companies);
      }
    }
    return this.findById(id);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await UserCompany.destroy({ where: { userId: id }, force: true });
    await user.destroy();
    return { success: true };
  }

  async lockUser(id) {
    return User.update({ isLocked: true, lockedAt: new Date() }, { where: { id } });
  }

  async unlockUser(id) {
    return User.update({ isLocked: false, lockedAt: null, loginAttempts: 0 }, { where: { id } });
  }

  async incrementLoginAttempts(id) {
    const user = await User.findByPk(id);
    if (!user) return null;
    const attempts = user.loginAttempts + 1;
    const locked = attempts >= 5;
    await user.update({ loginAttempts: attempts, isLocked: locked, lockedAt: locked ? new Date() : null });
    return user;
  }

  async resetLoginAttempts(id) {
    return User.update({ loginAttempts: 0, isLocked: false, lockedAt: null }, { where: { id } });
  }

  async recordLogin(id, ip) {
    return User.update({ lastLoginAt: new Date(), lastLoginIp: ip, loginAttempts: 0 }, { where: { id } });
  }
}

module.exports = new UserRepository();
