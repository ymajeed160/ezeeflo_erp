/**
 * @swagger
 * /api/hr/cost-centers:
 *   get:
 *     tags: [Organization]
 *     summary: List cost centers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of cost centers
 *   post:
 *     tags: [Organization]
 *     summary: Create cost center
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Cost center created
 * /api/hr/cost-centers/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get cost center
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Cost center details
 *   put:
 *     tags: [Organization]
 *     summary: Update cost center
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Organization]
 *     summary: Delete cost center
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
const express = require('express');
const ctrl = require('../controllers/CostCenterController');
const { costCenterValidator: v } = require('../validators/orgValidators');

const router = express.Router();
router.get('/', ctrl.getAll);
router.post('/', v.create, ctrl.create);
router.get('/:id', v.validateId, ctrl.getById);
router.put('/:id', v.validateId, v.update, ctrl.update);
router.delete('/:id', v.validateId, ctrl.delete);
module.exports = router;
