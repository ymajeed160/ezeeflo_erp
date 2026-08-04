const express = require('express');
const router = express.Router();
const companySubscriptionController = require('../controllers/CompanySubscriptionController');
const { superAdminAuth } = require('../../middleware/superAdminMiddleware');

// All routes require super admin auth
router.use(superAdminAuth);

router.get('/dashboard/stats', companySubscriptionController.getDashboardStats.bind(companySubscriptionController));
router.get('/', companySubscriptionController.getAll.bind(companySubscriptionController));
router.get('/:id', companySubscriptionController.getById.bind(companySubscriptionController));
router.get('/company/:companyId', companySubscriptionController.getByCompany.bind(companySubscriptionController));
router.post('/', companySubscriptionController.create.bind(companySubscriptionController));
router.put('/:id', companySubscriptionController.update.bind(companySubscriptionController));
router.post('/:id/cancel', companySubscriptionController.cancel.bind(companySubscriptionController));

module.exports = router;
