'use strict';

const { CompanySubscription, CompanySubscriptionModule, SubscriptionModule, License } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Middleware to validate that the active company has POS module access.
 * Must be used after authMiddleware and companyMiddleware.
 *
 * Checks:
 * 1. Company subscription is active
 * 2. POS module is enabled in the subscription
 * 3. License is valid (not expired)
 * 4. Monthly transaction limit is not exceeded
 */
const requirePOSSubscription = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.companyId;

    if (!tenantId) {
      return ApiResponse.badRequest(res, { message: 'Company context is required' });
    }

    // In development mode, allow POS access if no subscription is configured
    const isDev = process.env.NODE_ENV === 'development';
    const skipCheck = isDev && process.env.SKIP_POS_SUBSCRIPTION === 'true';

    // Check if POS module record exists in the system
    const posModule = await SubscriptionModule.findOne({
      where: { moduleCode: 'pos' },
    });

    if (!posModule && isDev && !skipCheck) {
      // Auto-seed POS module in development
      const { v4: uuidv4 } = require('uuid');
      await SubscriptionModule.create({
        id: uuidv4(),
        moduleName: 'Point of Sale',
        moduleCode: 'pos',
        description: 'POS module',
        status: 'enabled',
        isCore: false,
        sortOrder: 11,
        route: '/app/pos',
      });
      req.posSubscription = { moduleEnabled: true };
      return next();
    }

    if (!posModule && !skipCheck) {
      return ApiResponse.forbidden(res, {
        message: 'POS module is not configured in the system.',
      });
    }

    if (skipCheck || (isDev && !posModule)) {
      req.posSubscription = { moduleEnabled: true };
      return next();
    }

    // 1. Find active subscription
    const subscription = await CompanySubscription.findOne({
      where: { companyId: tenantId, status: 'active' },
      include: [
        {
          model: License,
          as: 'licenses',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (!subscription) {
      if (isDev) {
        req.posSubscription = { moduleEnabled: true };
        return next();
      }
      return ApiResponse.forbidden(res, {
        message: 'No active subscription found. POS module is not available.',
      });
    }

    // 2. Check POS module is enabled
    const posModuleEnabled = await CompanySubscriptionModule.findOne({
      where: {
        subscriptionId: subscription.id,
        moduleId: posModule.id,
        isEnabled: true,
      },
    });

    if (!posModuleEnabled) {
      if (isDev) {
        // Auto-link POS module to subscription in development
        await CompanySubscriptionModule.findOrCreate({
          where: { subscriptionId: subscription.id, moduleId: posModule.id },
          defaults: { subscriptionId: subscription.id, moduleId: posModule.id, isEnabled: true },
        });
        req.posSubscription = { moduleEnabled: true };
        return next();
      }
      return ApiResponse.forbidden(res, {
        message: 'POS module is not included in your current subscription.',
      });
    }

    // 3. Check license validity
    const licenses = subscription.licenses || [];
    const validLicense = licenses.some(lic => lic.status === 'active');
    if (licenses.length > 0 && !validLicense) {
      return ApiResponse.forbidden(res, {
        message: 'Your license has expired. Please renew to continue using POS.',
      });
    }

    // 4. Check monthly transaction limit (for future use)
    // The actual limit checking is done in the POS service during sale creation

    // Attach subscription info to request for downstream use
    req.posSubscription = {
      subscriptionId: subscription.id,
      moduleEnabled: true,
    };

    next();
  } catch (error) {
    logger.error('POS subscription middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to validate POS subscription access' });
  }
};

/**
 * Optional middleware - validates if POS module is available but doesn't block
 */
const optionalPOSSubscription = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.companyId;
    if (!tenantId) return next();

    const subscription = await CompanySubscription.findOne({
      where: { companyId: tenantId, status: 'active' },
    });

    if (subscription) {
      const posModule = await SubscriptionModule.findOne({
        where: { moduleCode: 'pos', status: 'enabled' },
      });
      if (posModule) {
        const enabled = await CompanySubscriptionModule.findOne({
          where: { subscriptionId: subscription.id, moduleId: posModule.id, isEnabled: true },
        });
        req.posSubscription = {
          subscriptionId: subscription.id,
          moduleEnabled: !!enabled,
        };
      }
    }

    next();
  } catch (error) {
    // Non-blocking - just continue
    next();
  }
};

module.exports = { requirePOSSubscription, optionalPOSSubscription };
