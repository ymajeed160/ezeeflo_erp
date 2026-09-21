const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AssetMaintenanceController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createMaintenanceValidation, updateMaintenanceValidation, maintenanceIdValidation } = require('../validators/assetMaintenanceValidation');

router.use(authMiddleware);
router.get('/next-number', requirePermission('fixedasset.maintenance'), (req, res, next) => ctrl.getNextMaintenanceNumber(req, res, next));
router.get('/due-reminders', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getDueReminders(req, res, next));
router.get('/', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getMaintenances(req, res, next));
router.get('/:id', requirePermission('fixedasset.view'), maintenanceIdValidation, (req, res, next) => ctrl.getMaintenanceById(req, res, next));
router.post('/', requirePermission('fixedasset.maintenance'), createMaintenanceValidation, (req, res, next) => ctrl.createMaintenance(req, res, next));
router.put('/:id', requirePermission('fixedasset.maintenance'), maintenanceIdValidation, updateMaintenanceValidation, (req, res, next) => ctrl.updateMaintenance(req, res, next));
router.delete('/:id', requirePermission('fixedasset.delete'), maintenanceIdValidation, (req, res, next) => ctrl.deleteMaintenance(req, res, next));

module.exports = router;
