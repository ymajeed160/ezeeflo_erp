const { Op } = require('sequelize');
const { User, RefreshToken, Role, Permission } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { NotFoundError, UnauthorizedError } = require('../utils/appError');
const logger = require('../utils/logger');

class AuthService {
  async login({ username, password, ip, userAgent }) {
    const user = await User.scope('withPassword').findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) throw new UnauthorizedError('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedError('Account is deactivated');
    if (user.isLocked) throw new UnauthorizedError('Account is locked');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) user.isLocked = true;
      await user.save();
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update user
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        isSuperAdmin: user.isSuperAdmin,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!storedToken) throw new UnauthorizedError('Refresh token revoked');

    if (new Date() > storedToken.expiresAt) {
      storedToken.isRevoked = true;
      await storedToken.save();
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');

    // Revoke old and issue new
    storedToken.isRevoked = true;
    await storedToken.save();

    const newAccessToken = this._generateAccessToken(user);
    const newRefreshToken = this._generateRefreshToken(user);

    await RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId, refreshToken) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId, token: refreshToken } }
    );
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 12);
    user.lastPasswordChange = new Date();
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.update({ isRevoked: true }, { where: { userId } });
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Don't reveal if user exists

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // In production, send email with reset link
    return { resetToken };
  }

  async resetPassword(token, newPassword) {
    const user = await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.lastPasswordChange = new Date();
    await user.save();

    await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });
  }

  _generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, companyId: user.companyId, isSuperAdmin: user.isSuperAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthService();
