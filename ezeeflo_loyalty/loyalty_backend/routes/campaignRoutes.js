const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/CampaignController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createCampaignValidator, updateCampaignStatusValidator } = require('../validators/phase4Validator');

router.use(authMiddleware);

router.get('/active', requirePermission('campaigns.view'), campaignController.getActive);
router.get('/', requirePermission('campaigns.view'), campaignController.getAll);
router.get('/:id', requirePermission('campaigns.view'), campaignController.getById);
router.post('/', requirePermission('campaigns.manage'), validate(createCampaignValidator), campaignController.create);
router.put('/:id', requirePermission('campaigns.manage'), campaignController.update);
router.delete('/:id', requirePermission('campaigns.manage'), campaignController.delete);
router.patch('/:id/status', requirePermission('campaigns.manage'), validate(updateCampaignStatusValidator), campaignController.updateStatus);

module.exports = router;
