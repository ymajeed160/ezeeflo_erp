/**
 * @swagger
 * /api/hr/leave-types:
 *   get:
 *     tags: [Leave]
 *     summary: List leave types
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Leave types
 *   post:
 *     tags: [Leave]
 *     summary: Create leave type
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/leave-applications:
 *   get:
 *     tags: [Leave]
 *     summary: List leave applications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Leave applications
 *   post:
 *     tags: [Leave]
 *     summary: Apply for leave
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Applied
 * /api/hr/leave-applications/summary:
 *   get:
 *     tags: [Leave]
 *     summary: Leave applications summary
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Summary
 * /api/hr/leave-applications/{id}/approve:
 *   post:
 *     tags: [Leave]
 *     summary: Approve leave
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Approved
 * /api/hr/leave-applications/{id}/reject:
 *   post:
 *     tags: [Leave]
 *     summary: Reject leave
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Rejected
 * /api/hr/leave-balances:
 *   get:
 *     tags: [Leave]
 *     summary: List leave balances
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Leave balances
 *   post:
 *     tags: [Leave]
 *     summary: Create leave balance
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/leave-balances/initialize:
 *   post:
 *     tags: [Leave]
 *     summary: Initialize leave balance
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Initialized
 * /api/hr/holidays:
 *   get:
 *     tags: [Leave]
 *     summary: List holidays
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Holidays
 *   post:
 *     tags: [Leave]
 *     summary: Create holiday
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 */
const express = require('express');
const { leaveTypeCtrl, leaveAppCtrl, leaveBalanceCtrl, holidayCtrl } = require('../controllers/LeaveControllers');
const { leaveTypeValidator, leaveAppValidator, leaveBalanceValidator, holidayValidator } = require('../validators/leaveValidators');

// Leave Types
const ltRoutes = express.Router();
ltRoutes.get('/', leaveTypeCtrl.getAll);
ltRoutes.post('/', leaveTypeValidator.create, leaveTypeCtrl.create);
ltRoutes.get('/:id', leaveTypeValidator.validateId, leaveTypeCtrl.getById);
ltRoutes.put('/:id', leaveTypeValidator.validateId, leaveTypeValidator.update, leaveTypeCtrl.update);
ltRoutes.delete('/:id', leaveTypeValidator.validateId, leaveTypeCtrl.delete);

// Leave Applications
const laRoutes = express.Router();
laRoutes.get('/', leaveAppCtrl.getAll);
laRoutes.get('/summary', leaveAppCtrl.getSummary);
laRoutes.post('/', leaveAppValidator.create, leaveAppCtrl.create);
laRoutes.get('/:id', leaveAppValidator.validateId, leaveAppCtrl.getById);
laRoutes.put('/:id', leaveAppValidator.validateId, leaveAppValidator.update, leaveAppCtrl.update);
laRoutes.delete('/:id', leaveAppValidator.validateId, leaveAppCtrl.delete);
laRoutes.post('/:id/approve', leaveAppValidator.validateId, leaveAppCtrl.approve);
laRoutes.post('/:id/reject', leaveAppValidator.validateId, leaveAppValidator.reject, leaveAppCtrl.reject);

// Leave Balances
const lbRoutes = express.Router();
lbRoutes.get('/', leaveBalanceCtrl.getAll);
lbRoutes.post('/', leaveBalanceValidator.create, leaveBalanceCtrl.create);
lbRoutes.post('/initialize', leaveBalanceValidator.initialize, leaveBalanceCtrl.initializeForEmployee);
lbRoutes.get('/:id', leaveBalanceValidator.validateId, leaveBalanceCtrl.getById);
lbRoutes.put('/:id', leaveBalanceValidator.validateId, leaveBalanceCtrl.update);
lbRoutes.delete('/:id', leaveBalanceValidator.validateId, leaveBalanceCtrl.delete);
lbRoutes.post('/:id/void', leaveBalanceValidator.validateId, leaveBalanceCtrl.void);

// Holidays
const holidayRoutes = express.Router();
holidayRoutes.get('/', holidayCtrl.getAll);
holidayRoutes.post('/', holidayValidator.create, holidayCtrl.create);
holidayRoutes.get('/:id', holidayValidator.validateId, holidayCtrl.getById);
holidayRoutes.put('/:id', holidayValidator.validateId, holidayValidator.update, holidayCtrl.update);
holidayRoutes.delete('/:id', holidayValidator.validateId, holidayCtrl.delete);

module.exports = { ltRoutes, laRoutes, lbRoutes, holidayRoutes };
