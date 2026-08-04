/**
 * @swagger
 * tags:
 *   name: Employees
 * /api/hr/employees:
 *   get:
 *     tags: [Employees]
 *     summary: List all employees
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated employee list
 *   post:
 *     tags: [Employees]
 *     summary: Create employee
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Employee created
 * /api/hr/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee by ID
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
 *         description: Employee details
 *   put:
 *     tags: [Employees]
 *     summary: Update employee
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
 *         description: Employee updated
 *   delete:
 *     tags: [Employees]
 *     summary: Delete employee
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
 *         description: Employee deleted
 */
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/EmployeeController');
const employeeValidator = require('../validators/employeeValidator');

/**
 * Employee Routes
 * 
 * GET    /api/hr/employees        — List all employees (paginated)
 * POST   /api/hr/employees        — Create a new employee
 * GET    /api/hr/employees/:id    — Get employee detail
 * PUT    /api/hr/employees/:id    — Update employee
 * DELETE /api/hr/employees/:id    — Delete employee
 */

router.get('/', employeeController.getAll);
router.post('/', employeeValidator.create, employeeController.create);
router.get('/me', employeeController.getMe);  // Must be before /:id
router.get('/directory', employeeController.getDirectory);  // Must be before /:id
router.get('/:id', employeeValidator.validateId, employeeController.getById);
router.put('/:id', employeeValidator.validateId, employeeValidator.update, employeeController.update);
router.delete('/:id', employeeValidator.validateId, employeeController.delete);

module.exports = router;
