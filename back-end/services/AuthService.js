const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const userRepository = require('../repositories/UserRepository');
const companyRepository = require('../repositories/CompanyRepository');
const { RefreshToken, User } = require('../models');
const sessionActivity = require('../utils/sessionActivity');
const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class AuthService {
  generateAccessToken(user, sessionId) {
    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        username: user.username,
        ...(sessionId ? { sid: sessionId } : {}),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );
  }

  generateRefreshToken(user, sessionId) {
    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        ...(sessionId ? { sid: sessionId } : {}),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  }

  async login({ identifier, password, ipAddress, userAgent }) {
    const user = await userRepository.findByEmailOrUsername(identifier);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (user.isLocked) {
      throw new UnauthorizedError('Account is locked. Contact administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await userRepository.incrementFailedAttempts(user.id);
      throw new UnauthorizedError('Invalid credentials');
    }

    await userRepository.resetFailedAttempts(user.id);
    await userRepository.updateLastLogin(user.id);

    // Single active session per user: block a login from another browser while
    // an existing session is still active (re-login from the same browser is fine).
    const activeSession = await RefreshToken.findOne({
      where: { userId: user.id, isRevoked: false, expiresAt: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']],
    });

    if (activeSession && (activeSession.userAgent || '') !== (userAgent || '')) {
      // Only block while that other session is actually in use. If its browser
      // was closed without signing out it goes idle, and this login takes over.
      const marker = await User.unscoped().findByPk(user.id, { attributes: ['refreshToken'] });
      if (sessionActivity.isActive(marker?.refreshToken)) {
        throw new ConflictError(
          'You are already logged in from another browser. Please sign out from that browser and try again.'
        );
      }
    }

    // Single active session per user: a new login ends every previous session.
    const sessionId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(user, sessionId);
    const refreshToken = this.generateRefreshToken(user, sessionId);

    // Revoke any existing sessions' refresh tokens before starting the new one.
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId: user.id, isRevoked: false } }
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user.id,
      tenantId: user.tenantId,
      token: refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    // Mark this session as the active one (checked by authMiddleware).
    await userRepository.updateRefreshToken(user.id, sessionId);
    sessionActivity.touch(sessionId);

    // Remove sensitive fields
    const userData = user.toJSON();
    delete userData.password;
    delete userData.refreshToken;
    delete userData.resetPasswordToken;

    // Get user's companies
    const companies = await companyRepository.findUserCompanies(user.id);

    // Get default company
    const defaultCompany = await companyRepository.getDefaultCompany(user.id);

    return {
      user: userData,
      accessToken,
      refreshToken,
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        code: c.subdomain,
        email: c.email,
        logo: c.logo,
        currency: c.currencyCode,
        country: c.country,
        isActive: c.isActive,
        isDefault: c.UserTenants && c.UserTenants.length > 0 ? c.UserTenants[0].isDefault : false,
      })),
      defaultCompanyId: defaultCompany ? defaultCompany.id : null,
    };
  }

  async refreshAccessToken(refreshTokenString) {
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const storedToken = await RefreshToken.findOne({
      where: { token: refreshTokenString, isRevoked: false },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      await storedToken.update({ isRevoked: true, revokedAt: new Date() });
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    // Only the active session may refresh — a newer login invalidates this one.
    const marker = await User.unscoped().findByPk(decoded.userId, { attributes: ['refreshToken'] });
    if (decoded.sid && marker?.refreshToken && decoded.sid !== marker.refreshToken) {
      await storedToken.update({ isRevoked: true, revokedAt: new Date() });
      throw new UnauthorizedError('Session ended: account signed in from another browser');
    }

    const newAccessToken = this.generateAccessToken(user, decoded.sid);
    const newRefreshToken = this.generateRefreshToken(user, decoded.sid);

    // Revoke old token and create new one
    await storedToken.update({ isRevoked: true, revokedAt: new Date() });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user.id,
      tenantId: user.tenantId,
      token: newRefreshToken,
      expiresAt,
      userAgent: storedToken.userAgent,
      ipAddress: storedToken.ipAddress,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async markSessionClosing(refreshTokenString) {
    if (!refreshTokenString) return false;
    try {
      const decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET);
      if (decoded.sid) sessionActivity.markClosing(decoded.sid);
      return true;
    } catch (err) {
      return false;
    }
  }

  async logout(userId, refreshTokenString) {
    const where = { userId, isRevoked: false };
    if (refreshTokenString) {
      where.token = refreshTokenString;
    }
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where }
    );
    const marker = await User.unscoped().findByPk(userId, { attributes: ['refreshToken'] });
    await userRepository.updateRefreshToken(userId, null);
    sessionActivity.clear(marker?.refreshToken);
    return true;
  }

  async logoutAll(userId) {
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId, isRevoked: false } }
    );
    const marker = await User.unscoped().findByPk(userId, { attributes: ['refreshToken'] });
    await userRepository.updateRefreshToken(userId, null);
    sessionActivity.clear(marker?.refreshToken);
    return true;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId, null, { scope: 'withPassword' });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.update(userId, {
      password: hashedPassword,
      lastPasswordChange: new Date(),
    }, null, userId);

    await this.logoutAll(userId);

    return true;
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return success even if user not found (security best practice)
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await userRepository.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: resetExpires,
    });

    return { resetToken, email: user.email, firstName: user.firstName };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      isLocked: false,
    });

    await this.logoutAll(user.id);

    return true;
  }
}

module.exports = new AuthService();