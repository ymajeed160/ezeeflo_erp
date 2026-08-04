const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');
const { SUPER_ADMIN_JWT_SECRET } = require('../middleware/superAdminAuthMiddleware');

/**
 * POST /api/superadmin/auth/login
 * Authenticates Super Admin users
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.badRequest(res, { message: 'Email and password required' });
    }

    // Find super admin by email (or username)
    let superAdmin = await superAdminRepo.findByEmail(email);
    if (!superAdmin) superAdmin = await superAdminRepo.findByUsername(email);

    if (!superAdmin) {
      // Log failed attempt
      await superAdminRepo.createLoginHistory({
        superAdminId: null, ipAddress: req.ip, userAgent: req.headers['user-agent'],
        isSuccess: false, failureReason: 'Invalid credentials - user not found',
      });
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, superAdmin.password);
    if (!valid) {
      await superAdminRepo.incrementLoginAttempts(superAdmin.id);
      await superAdminRepo.createLoginHistory({
        superAdminId: superAdmin.id, ipAddress: req.ip, userAgent: req.headers['user-agent'],
        isSuccess: false, failureReason: 'Invalid password',
      });
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    // Check if locked
    if (superAdmin.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account locked. Contact administrator.' });
    }

    // Check if active
    if (!superAdmin.isActive) {
      return ApiResponse.unauthorized(res, { message: 'Account deactivated' });
    }

    // Record login
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    await superAdminRepo.recordLogin(superAdmin.id, ip);

    // Sign JWT with super admin flag
    const accessToken = jwt.sign(
      {
        superAdminId: superAdmin.id,
        isSuperAdmin: true,
        email: superAdmin.email,
        username: superAdmin.username,
      },
      SUPER_ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    const refreshToken = jwt.sign(
      { superAdminId: superAdmin.id, type: 'refresh' },
      SUPER_ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await superAdminRepo.updateRefreshToken(superAdmin.id, refreshToken);

    // Log successful login
    await superAdminRepo.createLoginHistory({
      superAdminId: superAdmin.id,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
      isSuccess: true,
    });

    // Audit log
    await superAdminRepo.createAuditLog({
      superAdminId: superAdmin.id,
      action: 'LOGIN',
      entityType: 'super_admin',
      entityId: superAdmin.id,
      description: `Super Admin "${superAdmin.username}" logged in`,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          email: superAdmin.email,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName,
          role: 'super_admin',
          profilePicture: superAdmin.profilePicture,
        },
      },
    });
  } catch (error) {
    logger.error('Super Admin Login error:', { error: error.message, stack: error.stack });
    return ApiResponse.error(res, { message: 'Login failed' });
  }
};

/**
 * POST /api/superadmin/auth/refresh
 * Refresh access token
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.badRequest(res, { message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, SUPER_ADMIN_JWT_SECRET);
    } catch {
      return ApiResponse.unauthorized(res, { message: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return ApiResponse.unauthorized(res, { message: 'Invalid token type' });
    }

    // Verify stored token matches
    const superAdmin = await superAdminRepo.findById(decoded.superAdminId);
    if (!superAdmin || superAdmin.refreshToken !== refreshToken) {
      return ApiResponse.unauthorized(res, { message: 'Token revoked' });
    }

    if (!superAdmin.isActive || superAdmin.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account inactive or locked' });
    }

    // Issue new tokens
    const newAccessToken = jwt.sign(
      { superAdminId: superAdmin.id, isSuperAdmin: true, email: superAdmin.email, username: superAdmin.username },
      SUPER_ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    const newRefreshToken = jwt.sign(
      { superAdminId: superAdmin.id, type: 'refresh' },
      SUPER_ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    await superAdminRepo.updateRefreshToken(superAdmin.id, newRefreshToken);

    return ApiResponse.success(res, {
      message: 'Token refreshed',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    logger.error('Super Admin Refresh error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Token refresh failed' });
  }
};

/**
 * GET /api/superadmin/auth/me
 * Get current super admin from token
 */
const me = async (req, res) => {
  try {
    const superAdmin = await superAdminRepo.findById(req.superAdminId);
    if (!superAdmin) {
      return ApiResponse.unauthorized(res, { message: 'Super admin not found' });
    }

    return ApiResponse.success(res, {
      data: {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        phone: superAdmin.phone,
        profilePicture: superAdmin.profilePicture,
        role: 'super_admin',
        lastLoginAt: superAdmin.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error('Super Admin Me error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch profile' });
  }
};

/**
 * POST /api/superadmin/auth/logout
 * Logout and revoke refresh token
 */
const logout = async (req, res) => {
  try {
    await superAdminRepo.clearRefreshToken(req.superAdminId);

    // Update login history with logout time
    const loginRecord = await superAdminRepo.getLoginHistory({ superAdminId: req.superAdminId, page: 1, limit: 1 });
    if (loginRecord.data.length > 0) {
      const record = loginRecord.data[0];
      const duration = record.loginAt ? Math.floor((Date.now() - record.loginAt.getTime()) / 1000) : null;
      await superAdminRepo.updateLoginHistory(record.id, { logoutAt: new Date(), sessionDuration: duration });
    }

    // Audit log
    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'LOGOUT',
      entityType: 'super_admin',
      entityId: req.superAdminId,
      description: `Super Admin "${req.superAdmin.username}" logged out`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Super Admin Logout error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Logout failed' });
  }
};

/**
 * PUT /api/superadmin/auth/change-password
 * Change password for current super admin
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(res, { message: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return ApiResponse.badRequest(res, { message: 'Password must be at least 8 characters' });
    }

    const superAdmin = await superAdminRepo.findByEmail(req.superAdmin.email);
    const valid = await bcrypt.compare(currentPassword, superAdmin.password);
    if (!valid) {
      return ApiResponse.badRequest(res, { message: 'Current password is incorrect' });
    }

    await superAdminRepo.update(superAdmin.id, {
      password: newPassword,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
    });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'PASSWORD_CHANGED',
      entityType: 'super_admin',
      entityId: req.superAdminId,
      description: 'Password changed',
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Super Admin Change Password error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Password change failed' });
  }
};

module.exports = { login, refresh, me, logout, changePassword };
