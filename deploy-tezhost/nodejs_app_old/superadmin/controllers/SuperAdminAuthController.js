const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const ApiResponse = require('../../utils/apiResponse');
const { StatusCodes } = require('http-status-codes');

class SuperAdminAuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, { message: 'Email and password are required' });
      }

      const user = await User.scope('withPassword').findOne({
        where: { email },
      });

      if (!user) {
        return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
      }

      // CRITICAL: Only super admins can login via this endpoint
      if (!user.isSuperAdmin) {
        return ApiResponse.error(res, {
          message: 'Forbidden. Super Admin access required.',
          statusCode: 403,
        });
      }

      if (!user.isActive) {
        return ApiResponse.unauthorized(res, { message: 'Account is deactivated' });
      }

      if (user.isLocked) {
        return ApiResponse.unauthorized(res, { message: 'Account is locked. Contact administrator.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return ApiResponse.unauthorized(res, { message: 'Invalid credentials' });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate JWT
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      );

      return ApiResponse.success(res, {
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isSuperAdmin: user.isSuperAdmin,
          },
          accessToken,
          refreshToken,
        },
        message: 'Super Admin login successful',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminAuthController();
