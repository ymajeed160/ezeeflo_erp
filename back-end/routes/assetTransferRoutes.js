const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AssetTransferController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createTransferValidation, transferIdValidation } = require('../validators/assetTransferValidation');

router.use(authMiddleware);

router.get('/next-number', requirePermission('fixedasset.transfer'), (req, res, next) => ctrl.getNextTransferNumber(req, res, next));
router.get('/by-asset/:assetId', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getTransferHistory(req, res, next));
router.get('/', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getTransfers(req, res, next));
router.get('/:id', requirePermission('fixedasset.view'), transferIdValidation, (req, res, next) => ctrl.getTransferById(req, res, next));
router.post('/', requirePermission('fixedasset.transfer'), createTransferValidation, (req, res, next) => ctrl.createTransfer(req, res, next));
router.delete('/:id', requirePermission('fixedasset.delete'), transferIdValidation, (req, res, next) => ctrl.deleteTransfer(req, res, next));

module.exports = router;
