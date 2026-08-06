const express = require('express');
const router = express.Router();
const companyController = require('../controllers/CompanyController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);

module.exports = router;
