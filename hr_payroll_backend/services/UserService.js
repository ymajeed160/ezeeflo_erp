const userRepo = require('../repositories/UserRepository');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');

const userToDTO = (u) => u ? {
  id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName,
  phone: u.phone, profilePicture: u.profilePicture, role: u.role,
  isActive: u.isActive, isLocked: u.isLocked, lockedAt: u.lockedAt,
  loginAttempts: u.loginAttempts, lastLoginAt: u.lastLoginAt, lastLoginIp: u.lastLoginIp,
  passwordChangedAt: u.passwordChangedAt, mustChangePassword: u.mustChangePassword,
  mfaEnabled: u.mfaEnabled,
  companies: (u.companies || []).map(c => ({ id: c.id, companyId: c.companyId, isDefault: c.isDefault })),
  createdAt: u.createdAt, updatedAt: u.updatedAt,
} : null;

class UserService {
  async getAll(query) { const r = await userRepo.findAll({ query }); r.data = r.data.map(userToDTO); return r; }
  
  async getById(id) { const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found'); return userToDTO(u); }

  async create(data, userId, tenantId) {
    const exists = await userRepo.findByEmail(data.email);
    if (exists) throw new ConflictError('Email already exists');
    if (data.username) {
      const uname = await userRepo.findByUsername(data.username);
      if (uname) throw new ConflictError('Username already exists');
    }
    if (!data.username) data.username = data.email;
    // Auto-assign company from current tenant if not explicitly provided
    const companyIds = data.companyIds || (tenantId ? [tenantId] : []);
    return userToDTO(await userRepo.create({ ...data, companyIds, createdBy: userId, updatedBy: userId }));
  }

  async update(id, data, userId) {
    const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found');
    if (data.email && data.email !== u.email) {
      const exists = await userRepo.findByEmail(data.email);
      if (exists && exists.id !== id) throw new ConflictError('Email already exists');
    }
    return userToDTO(await userRepo.update(id, { ...data, updatedBy: userId }));
  }

  async delete(id) { const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found'); return userRepo.delete(id); }
  async lockUser(id) { const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found'); await userRepo.lockUser(id); return { success: true }; }
  async unlockUser(id) { const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found'); await userRepo.unlockUser(id); return { success: true }; }

  async resetPassword(id, newPassword, userId) {
    const u = await userRepo.findById(id); if (!u) throw new NotFoundError('User not found');
    await userRepo.update(id, { password: newPassword, mustChangePassword: true, passwordChangedAt: new Date(), updatedBy: userId });
    return { success: true };
  }
}

module.exports = new UserService();
