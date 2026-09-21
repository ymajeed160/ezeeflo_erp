const express = require('express');
const router = express.Router();
const companyController = require('../controllers/CompanyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Company selection (no company context needed)
router.post('/select', companyController.selectCompany);
router.post('/switch', companyController.switchCompany);

// Company CRUD
router.get('/', companyController.getUserCompanies);
router.post('/', companyController.createCompany);
router.get('/current', companyMiddleware, companyController.getCurrentCompany);
// Enabled modules route MUST be before /:id to avoid being captured as an ID param
router.get('/enabled-modules', companyMiddleware, companyController.getEnabledModules);
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);

module.exports = router;
