/**
 * @swagger
 * /api/hr/branches:
 *   get:
 *     tags: [Organization]
 *     summary: List branches
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of branches
 *   post:
 *     tags: [Organization]
 *     summary: Create branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Branch created
 * /api/hr/branches/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get branch
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
 *         description: Branch details
 *   put:
 *     tags: [Organization]
 *     summary: Update branch
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
 *     summary: Delete branch
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
const ctrl = require('../controllers/BranchController');
const { branchValidator: v } = require('../validators/orgValidators');

const router = express.Router();
router.get('/', ctrl.getAll);
router.post('/', v.create, ctrl.create);
router.get('/:id', v.validateId, ctrl.getById);
router.put('/:id', v.validateId, v.update, ctrl.update);
router.delete('/:id', v.validateId, ctrl.delete);
module.exports = router;
