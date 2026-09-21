/**
 * @swagger
 * tags:
 *   name: Organization
 * /api/hr/departments:
 *   get:
 *     tags: [Organization]
 *     summary: List departments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of departments
 *   post:
 *     tags: [Organization]
 *     summary: Create department
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Department created
 * /api/hr/departments/{id}:
 *   get:
 *     tags: [Organization]
 *     summary: Get department
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
 *         description: Department details
 *   put:
 *     tags: [Organization]
 *     summary: Update department
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
 *     summary: Delete department
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
const ctrl = require('../controllers/DepartmentController');
const { departmentValidator: v } = require('../validators/orgValidators');

const router = express.Router();
router.get('/', ctrl.getAll);
router.post('/', v.create, ctrl.create);
router.get('/:id', v.validateId, ctrl.getById);
router.put('/:id', v.validateId, v.update, ctrl.update);
router.delete('/:id', v.validateId, ctrl.delete);
module.exports = router;
