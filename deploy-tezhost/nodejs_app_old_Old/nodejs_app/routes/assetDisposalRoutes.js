const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AssetDisposalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createDisposalValidation, disposalIdValidation } = require('../validators/assetDisposalValidation');

router.use(authMiddleware);
router.get('/next-number', requirePermission('fixedasset.dispose'), (req, res, next) => ctrl.getNextDisposalNumber(req, res, next));
router.get('/', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getDisposals(req, res, next));
router.get('/:id', requirePermission('fixedasset.view'), disposalIdValidation, (req, res, next) => ctrl.getDisposalById(req, res, next));
router.post('/', requirePermission('fixedasset.dispose'), createDisposalValidation, (req, res, next) => ctrl.createDisposal(req, res, next));
router.post('/:id/post', requirePermission('fixedasset.dispose'), disposalIdValidation, (req, res, next) => ctrl.postDisposal(req, res, next));
router.post('/:id/reverse', requirePermission('fixedasset.edit'), disposalIdValidation, (req, res, next) => ctrl.reverseDisposal(req, res, next));
router.delete('/:id', requirePermission('fixedasset.delete'), disposalIdValidation, (req, res, next) => ctrl.deleteDisposal(req, res, next));

module.exports = router;
