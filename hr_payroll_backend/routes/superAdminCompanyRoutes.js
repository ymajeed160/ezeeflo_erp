const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const {
  listCompanies, getCompany, createCompany, updateCompany,
  changeCompanyStatus, deleteCompany, getCompanyAdmins, exportCompanies,
} = require('../controllers/SuperAdminCompanyController');

router.use(superAdminAuthMiddleware);

router.get('/export', exportCompanies);
router.get('/', listCompanies);
router.post('/', createCompany);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.patch('/:id/status', changeCompanyStatus);
router.delete('/:id', deleteCompany);
router.get('/:id/admins', getCompanyAdmins);

module.exports = router;
