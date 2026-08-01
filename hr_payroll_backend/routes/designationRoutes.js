/**
 * @swagger
 * /api/hr/designations:
 *   get:
 *     tags: [Organization]
 *     summary: List designations
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of designations
 *   post:
 *     tags: [Organization]
 *     summary: Create designation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Designation created
 * /api/hr/designations/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get designation
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
 *         description: Designation details
 *   put:
 *     tags: [Organization]
 *     summary: Update designation
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
 *     summary: Delete designation
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
const ctrl = require('../controllers/DesignationController');
const { designationValidator: v } = require('../validators/orgValidators');

const router = express.Router();
router.get('/', ctrl.getAll);
router.post('/', v.create, ctrl.create);
router.get('/:id', v.validateId, ctrl.getById);
router.put('/:id', v.validateId, v.update, ctrl.update);
router.delete('/:id', v.validateId, ctrl.delete);
module.exports = router;
