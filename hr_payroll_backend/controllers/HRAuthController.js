const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const userRepo = require('../repositories/UserRepository');

/**
 * POST /api/hr/auth/login
 * Authenticates against HR users table (primary) with ERP fallback
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.badRequest(res, { message: 'Email and password required' });
    }

    // 1. Try HR users table first (by email, then by username)
    let user = await userRepo.findByEmail(email);
    if (!user) user = await userRepo.findByUsername(email);
    let source = 'hr';

    // 2. Fallback to ERP database if not found in HR
    if (!user) {
      try {
        const { Sequelize } = require('sequelize');
        const erpDb = new Sequelize(
          process.env.ERP_DB_NAME || 'erp_mt_suite',
          process.env.HR_DB_USER || 'root',
          process.env.HR_DB_PASSWORD || 'Memits@396',
          { host: process.env.HR_DB_HOST || '127.0.0.1', port: process.env.HR_DB_PORT || 3306, dialect: 'mysql', logging: false }
        );
        const [erpUsers] = await erpDb.query(
          'SELECT id, username, email, password, first_name, last_name, is_active, tenant_id FROM users WHERE (email = ? OR username = ?) AND is_active = 1 LIMIT 1',
          { replacements: [email, email], type: Sequelize.QueryTypes.SELECT }
        );
        const erpUser = Array.isArray(erpUsers) ? erpUsers[0] : erpUsers;
        if (erpUser) {
          const valid = await bcrypt.compare(password, erpUser.password);
          if (valid) {
            // Auto-create HR user from ERP (with tenant/company association)
            user = await userRepo.create({
              username: erpUser.username || erpUser.email,
              email: erpUser.email,
              password: password,
              firstName: erpUser.first_name || '',
              lastName: erpUser.last_name || '',
              role: 'super_admin',
              companyIds: erpUser.tenant_id ? [erpUser.tenant_id] : [],
            });
            source = 'erp_sync';
          }
        }
        await erpDb.close();
      } catch (e) { logger.warn('ERP fallback failed:', e.message || e, e.stack?.split('\n')[0]); }
    }

    if (!user) {
      return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await userRepo.incrementLoginAttempts(user.id);
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
    await userRepo.recordLogin(user.id, ip);

    // Get user's companies (from user_companies, look up names in ERP)
    const companies = (user.companies || []).map(c => c.companyId);
    let tenants = [];
    if (companies.length > 0) {
      try {
        const { Sequelize } = require('sequelize');
        const erpDb = new Sequelize(
          process.env.ERP_DB_NAME || 'erp_mt_suite',
          process.env.HR_DB_USER || 'root',
          process.env.HR_DB_PASSWORD || 'Memits@396',
          { host: process.env.HR_DB_HOST || '127.0.0.1', port: process.env.HR_DB_PORT || 3306, dialect: 'mysql', logging: false }
        );
        const comps = await erpDb.query(
          'SELECT id, name FROM tenants WHERE id IN (?)',
          { replacements: [companies], type: Sequelize.QueryTypes.SELECT }
        );
        tenants = (comps || []).map(c => ({ id: c.id, name: c.name }));
        await erpDb.close();
      } catch (e) { logger.warn('Company lookup failed:', e.message); }
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
    logger.error('HR Login error:', { error: error.message });
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
