/**
 * @swagger
 * /api/hr/benefit-types:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List benefit types
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create benefit type
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/employee-benefits:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List employee benefits
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create employee benefit
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/eosb-calculations:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List EOSB calculations
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create EOSB calculation
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/eosb-calculations/calculate:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Calculate EOSB
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Calculated } }
 * /api/hr/eosb-settlements:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List EOSB settlements
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create EOSB settlement
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/eosb-settlements/settle:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Settle EOSB
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Settled } }
 * /api/hr/eosb-settlements/{id}/approve:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Approve EOSB settlement
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Approved } }
 * /api/hr/wps:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List WPS configs
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create WPS config
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/wps/generate-export:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Generate WPS export
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Generated } }
 * /api/hr/wps/{id}/set-default:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Set default WPS config
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Default set } }
 * /api/hr/ess-submissions:
 *   get:
 *     tags: [Benefits & EOSB]
 *     summary: List ESS submissions
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Create ESS submission
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/ess-submissions/{id}/approve:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Approve ESS submission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Approved } }
 * /api/hr/ess-submissions/{id}/reject:
 *   post:
 *     tags: [Benefits & EOSB]
 *     summary: Reject ESS submission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Rejected } }
 */
const express = require('express');
const { btCtrl, ebCtrl, eosbCalcCtrl, eosbSettleCtrl, wpsCtrl, essCtrl } = require('../controllers/BenefitsControllers');

const r = (ctrl) => {
  const router = express.Router();
  router.get('/', ctrl.getAll); router.post('/', ctrl.create);
  router.get('/:id', ctrl.getById); router.put('/:id', ctrl.update); router.delete('/:id', ctrl.delete);
  return router;
};

const eosbCalcRoutes = r(eosbCalcCtrl);
eosbCalcRoutes.post('/calculate', eosbCalcCtrl.calculate);

const eosbSettleRoutes = r(eosbSettleCtrl);
eosbSettleRoutes.post('/settle', eosbSettleCtrl.settle);
eosbSettleRoutes.post('/:id/approve', eosbSettleCtrl.approve);

const wpsRoutes = r(wpsCtrl);
wpsRoutes.post('/:id/set-default', wpsCtrl.setDefault);
wpsRoutes.post('/generate-export', wpsCtrl.generateExport);

const essRoutes = r(essCtrl);
essRoutes.post('/:id/approve', essCtrl.approve);
essRoutes.post('/:id/reject', essCtrl.reject);

module.exports = {
  btRoutes: r(btCtrl), ebRoutes: r(ebCtrl),
  eosbCalcRoutes, eosbSettleRoutes, wpsRoutes, essRoutes,
};
