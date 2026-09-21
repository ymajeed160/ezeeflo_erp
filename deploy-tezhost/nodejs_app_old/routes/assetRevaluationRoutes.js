const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AssetRevaluationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createRevaluationValidation, revaluationIdValidation } = require('../validators/assetRevaluationValidation');

router.use(authMiddleware);
router.get('/next-number', requirePermission('fixedasset.revalue'), (req, res, next) => ctrl.getNextRevaluationNumber(req, res, next));
router.get('/', requirePermission('fixedasset.view'), (req, res, next) => ctrl.getRevaluations(req, res, next));
router.get('/:id', requirePermission('fixedasset.view'), revaluationIdValidation, (req, res, next) => ctrl.getRevaluationById(req, res, next));
router.post('/', requirePermission('fixedasset.revalue'), createRevaluationValidation, (req, res, next) => ctrl.createRevaluation(req, res, next));
router.post('/:id/post', requirePermission('fixedasset.revalue'), revaluationIdValidation, (req, res, next) => ctrl.postRevaluation(req, res, next));
router.delete('/:id', requirePermission('fixedasset.delete'), revaluationIdValidation, (req, res, next) => ctrl.deleteRevaluation(req, res, next));

module.exports = router;
