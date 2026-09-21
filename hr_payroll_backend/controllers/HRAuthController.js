const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const userRepo = require('../repositories/UserRepository');

/**
 * POST /api/hr/auth/login
 * Authenticates against HR users table only
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.badRequest(res, { message: 'Email and password required' });
    }

    // Find user in HR users table (by email, then by username)
    let user = await userRepo.findByEmail(email);
    if (!user) user = await userRepo.findByUsername(email);

    if (!user) {
      logger.warn('HR Login: user not found', { email });
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    // Verify password
    if (!user.password) {
      logger.error('HR Login: user has no password field', { userId: user.id, email });
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await userRepo.incrementLoginAttempts(user.id);
      logger.warn('HR Login: invalid password', { userId: user.id, email });
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    // Check if locked
    if (user.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account locked. Contact administrator.' });
    }

    // Check if active
    if (!user.isActive) {
      return ApiResponse.unauthorized(res, { message: 'Account deactivated' });
    }

    // Record login
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    await userRepo.recordLogin(user.id, ip).catch(e => logger.warn('Login record failed:', e.message));

    // Get companies from user_companies, lookup names from super_admin_companies
    let tenants = [];
    try {
      const companies = user.companies || [];
      if (companies.length > 0) {
        const companyIds = companies.map(c => c.companyId || c.company_id);
        // Try to look up names from super_admin_companies table in HR DB
        const db = require('../models');
        const sac = await db.SuperAdminCompany.findAll({
          where: { id: companyIds },
          attributes: ['id', 'name'],
          raw: true,
        }).catch(() => []);
        const nameMap = {};
        (sac || []).forEach(c => { nameMap[c.id] = c.name; });

        tenants = companyIds.map(cid => ({
          id: cid,
          name: nameMap[cid] || `Company (${cid.substring(0, 8)}...)`,
        }));
      }
    } catch (e) {
      logger.warn('Company lookup skipped:', e.message);
    }

    // Sign JWT with role
    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: tenants[0]?.id || null },
      process.env.JWT_SECRET || '1e94259d8cf4146c849a1192f5f7460fa024b58fbda0b47015487dd21bb7fd87',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'bdb378df10a0479efbdea3aa152cd78d8b3dfc8cac61412c389c52cf317de41c',
      { expiresIn: '7d' }
    );

    logger.info('HR Login: success', { userId: user.id, email, role: user.role });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        accessToken: token,
        refreshToken,
        user: {
          id: user.id, username: user.username, email: user.email,
          firstName: user.firstName, lastName: user.lastName, role: user.role,
          profilePicture: user.profilePicture,
        },
        tenants,
      },
    });
  } catch (error) {
    logger.error('HR Login error:', { error: error.message, stack: error.stack?.split('\n').slice(0, 3).join('\n') });
    return ApiResponse.error(res, { message: 'Login failed' });
  }
};

/**
 * GET /api/hr/auth/me — Get current user from token
 */
const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return ApiResponse.unauthorized(res, { message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepo.findById(decoded.userId);
    if (!user) return ApiResponse.unauthorized(res, { message: 'User not found' });

    return ApiResponse.success(res, {
      data: {
        id: user.id, username: user.username, email: user.email,
        firstName: user.firstName, lastName: user.lastName, role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    return ApiResponse.unauthorized(res, { message: 'Invalid token' });
  }
};

module.exports = { login, me };
