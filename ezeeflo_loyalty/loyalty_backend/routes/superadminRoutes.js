const express = require('express');
const router = express.Router();
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
const superAdminPlanController = require('../controllers/superadmin/SuperAdminPlanController');
const superAdminDashboardController = require('../controllers/superadmin/SuperAdminDashboardController');
const companyController = require('../controllers/CompanyController');
const validate = require('../middleware/validate');
const { createCompanyValidator, updateCompanyValidator, updateStatusValidator } = require('../validators/companyValidator');

router.use(superAdminMiddleware);

// Dashboard
router.get('/dashboard/stats', superAdminDashboardController.getStats);

// Plans
router.get('/plans', superAdminPlanController.getAll);
router.get('/plans/:id', superAdminPlanController.getById);
router.post('/plans', superAdminPlanController.create);
router.put('/plans/:id', superAdminPlanController.update);
router.delete('/plans/:id', superAdminPlanController.delete);
router.patch('/plans/:id/toggle-status', superAdminPlanController.toggleStatus);

// Plan Dashboard
router.get('/plans/dashboard/overview', superAdminPlanController.getDashboardStats);

// Modules
router.get('/modules', superAdminPlanController.getModules);
router.post('/modules', superAdminPlanController.createModule);
router.put('/modules/:id', superAdminPlanController.updateModule);
router.delete('/modules/:id', superAdminPlanController.deleteModule);

// Companies (Super Admin manages all companies)
router.get('/companies', companyController.getAll);
router.get('/companies/:id', companyController.getById);
router.post('/companies', validate(createCompanyValidator), companyController.create);
router.put('/companies/:id', validate(updateCompanyValidator), companyController.update);
router.patch('/companies/:id/status', validate(updateStatusValidator), companyController.updateStatus);
router.delete('/companies/:id', companyController.delete);

// Assign Plan to Company
router.post('/companies/:companyId/assign-plan', superAdminPlanController.assignPlan);

module.exports = router;
