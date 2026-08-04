/**
 * Employee Asset Routes
 * 
 * /api/hr/employee-assets
 */
const express = require('express');
const ctrl = require('../controllers/EmployeeAssetController');

const router = express.Router();

// NOTE: /me must be before /:id to avoid matching "me" as an id
router.get('/me', ctrl.getMyAssets);
router.get('/employee/:employeeId', ctrl.getByEmployee);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
