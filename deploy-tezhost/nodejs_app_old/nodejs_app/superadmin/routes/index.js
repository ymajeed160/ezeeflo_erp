const express = require('express');
const router = express.Router();
const { Tenant } = require('../../models');
const ApiResponse = require('../../utils/apiResponse');
const { superAdminAuth } = require('../../middleware/superAdminMiddleware');

const superAdminAuthRoutes = require('./authRoutes');
const subscriptionPlanRoutes = require('./subscriptionPlanRoutes');
const subscriptionModuleRoutes = require('./subscriptionModuleRoutes');
const companySubscriptionRoutes = require('./companySubscriptionRoutes');

// Super Admin routes — all prefixed with /api/superadmin
router.use('/auth', superAdminAuthRoutes);
router.use('/plans', subscriptionPlanRoutes);
router.use('/modules', subscriptionModuleRoutes);
router.use('/subscriptions', companySubscriptionRoutes);

// List all companies (for subscription assignment)
router.get('/companies', superAdminAuth, async (req, res, next) => {
  try {
    const companies = await Tenant.findAll({
      attributes: ['id', 'name', 'email', 'isActive'],
      order: [['name', 'ASC']],
    });
    return ApiResponse.success(res, { data: companies });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
