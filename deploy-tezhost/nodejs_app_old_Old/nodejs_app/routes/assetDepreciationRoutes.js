const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AssetDepreciationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { postDepreciationValidation, previewDepreciationValidation, deprIdValidation } = require('../validators/assetDepreciationValidation');

router.use(authMiddleware);

router.get('/next-number', requirePermission('fixedasset.depreciate'), (req, res, next) => ctrl.getNextDepreciationNumber(req, res, next));
router.post('/preview', requirePermission('fixedasset.depreciate'), previewDepreciationValidation, (req, res, next) => ctrl.previewDepreciation(req, res, next));
router.post('/post', requirePermission('fixedasset.depreciate'), postDepreciationValidation, (req, res, next) => ctrl.postDepreciation(req, res, next));
router.post('/:id/reverse', requirePermission('fixedasset.depreciate'), deprIdValidation, (req, res, next) => ctrl.reverseDepreciation(req, res, next));
router.get('/', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getDepreciations(req, res, next));
router.get('/:id', requirePermission('fixedasset.view'), deprIdValidation, (req, res, next) => ctrl.getDepreciationById(req, res, next));
router.delete('/:id', requirePermission('fixedasset.delete'), deprIdValidation, (req, res, next) => ctrl.deleteDepreciation(req, res, next));

module.exports = router;
