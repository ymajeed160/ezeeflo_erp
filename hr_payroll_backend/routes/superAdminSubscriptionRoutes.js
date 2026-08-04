const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const {
  listPlans, getPlan, createPlan, updatePlan, deletePlan, seedDefaultPlans,
  listModules, toggleModule, assignModulesToCompany,
} = require('../controllers/SuperAdminSubscriptionController');

router.use(superAdminAuthMiddleware);

// Plans
router.get('/plans', listPlans);
router.get('/plans/:id', getPlan);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.post('/plans/seed', seedDefaultPlans);

// Modules
router.get('/modules', listModules);
router.post('/modules/toggle', toggleModule);
router.post('/modules/assign', assignModulesToCompany);

module.exports = router;
