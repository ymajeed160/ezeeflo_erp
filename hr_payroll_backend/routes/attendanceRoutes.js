/**
 * @swagger
 * /api/hr/shifts:
 *   get:
 *     tags: [Attendance]
 *     summary: List shifts
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of shifts
 *   post:
 *     tags: [Attendance]
 *     summary: Create shift
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Shift created
 * /api/hr/shifts/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get shift
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Shift details
 *   put:
 *     tags: [Attendance]
 *     summary: Update shift
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete shift
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 * /api/hr/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Attendance records
 * /api/hr/attendance/today-summary:
 *   get:
 *     tags: [Attendance]
 *     summary: Today attendance summary
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Today summary
 * /api/hr/attendance/mark:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Marked
 * /api/hr/attendance/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk mark attendance
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Bulk marked
 * /api/hr/attendance/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Record details
 *   put:
 *     tags: [Attendance]
 *     summary: Update attendance record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete attendance record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 * /api/hr/shift-assignments:
 *   get:
 *     tags: [Attendance]
 *     summary: List shift assignments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Shift assignments
 *   post:
 *     tags: [Attendance]
 *     summary: Create shift assignment
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/rosters:
 *   get:
 *     tags: [Attendance]
 *     summary: List rosters
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Rosters
 *   post:
 *     tags: [Attendance]
 *     summary: Create roster
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/rosters/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk create rosters
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/rosters/generate:
 *   post:
 *     tags: [Attendance]
 *     summary: Generate roster
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Generated
 * /api/hr/overtime:
 *   get:
 *     tags: [Attendance]
 *     summary: List overtime entries
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Overtime entries
 *   post:
 *     tags: [Attendance]
 *     summary: Create overtime entry
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /api/hr/overtime/{id}/approve:
 *   post:
 *     tags: [Attendance]
 *     summary: Approve overtime
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Approved
 */
const express = require('express');
const { shiftCtrl, attendanceCtrl, saCtrl, rosterCtrl, overtimeCtrl } = require('../controllers/AttendanceControllers');
const { shiftValidator, attendanceValidator, saValidator, rosterValidator, overtimeValidator } = require('../validators/attendanceValidators');

// Shifts
const shiftRoutes = express.Router();
shiftRoutes.get('/', shiftCtrl.getAll);
shiftRoutes.post('/', shiftValidator.create, shiftCtrl.create);
shiftRoutes.get('/:id', shiftValidator.validateId, shiftCtrl.getById);
shiftRoutes.put('/:id', shiftValidator.validateId, shiftValidator.update, shiftCtrl.update);
shiftRoutes.delete('/:id', shiftValidator.validateId, shiftCtrl.delete);

// Attendance
const attendanceRoutes = express.Router();
attendanceRoutes.get('/', attendanceCtrl.getAll);
attendanceRoutes.get('/today-summary', attendanceCtrl.getTodaySummary);
attendanceRoutes.post('/mark', attendanceValidator.markAttendance, attendanceCtrl.markAttendance);
attendanceRoutes.post('/bulk', attendanceCtrl.bulkMark);
attendanceRoutes.get('/:id', attendanceValidator.validateId, attendanceCtrl.getById);
attendanceRoutes.put('/:id', attendanceValidator.validateId, attendanceValidator.update, attendanceCtrl.update);
attendanceRoutes.delete('/:id', attendanceValidator.validateId, attendanceCtrl.delete);

// Shift Assignments
const saRoutes = express.Router();
saRoutes.get('/', saCtrl.getAll);
saRoutes.post('/', saValidator.create, saCtrl.create);
saRoutes.get('/:id', saValidator.validateId, saCtrl.getById);
saRoutes.put('/:id', saValidator.validateId, saValidator.update, saCtrl.update);
saRoutes.delete('/:id', saValidator.validateId, saCtrl.delete);

// Rosters
const rosterRoutes = express.Router();
rosterRoutes.get('/', rosterCtrl.getAll);
rosterRoutes.post('/', rosterValidator.create, rosterCtrl.create);
rosterRoutes.post('/bulk', rosterCtrl.bulkCreate);
rosterRoutes.post('/generate', rosterValidator.generate, rosterCtrl.generate);
rosterRoutes.get('/:id', rosterValidator.validateId, rosterCtrl.getById);
rosterRoutes.put('/:id', rosterValidator.validateId, rosterCtrl.update);
rosterRoutes.delete('/:id', rosterValidator.validateId, rosterCtrl.delete);

// Overtime
const overtimeRoutes = express.Router();
overtimeRoutes.get('/', overtimeCtrl.getAll);
overtimeRoutes.post('/', overtimeValidator.create, overtimeCtrl.create);
overtimeRoutes.get('/:id', overtimeValidator.validateId, overtimeCtrl.getById);
overtimeRoutes.put('/:id', overtimeValidator.validateId, overtimeValidator.update, overtimeCtrl.update);
overtimeRoutes.delete('/:id', overtimeValidator.validateId, overtimeCtrl.delete);
overtimeRoutes.post('/:id/approve', overtimeValidator.validateId, overtimeCtrl.approve);

module.exports = { shiftRoutes, attendanceRoutes, saRoutes, rosterRoutes, overtimeRoutes };
