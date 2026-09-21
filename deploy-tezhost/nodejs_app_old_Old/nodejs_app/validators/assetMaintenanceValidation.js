const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const maintenanceIdValidation = [param('id').notEmpty().isUUID(4), handleValidationErrors];

const maintTypes = ['preventive', 'corrective', 'amc'];
const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const createMaintenanceValidation = [
  body('maintenanceNumber').optional().trim().isLength({ max: 50 }),
  body('assetId').notEmpty().isUUID(4),
  body('maintenanceType').notEmpty().isIn(maintTypes),
  body('title').trim().notEmpty().isLength({ max: 300 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('serviceProvider').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('maintenanceDate').optional({ nullable: true }).isISO8601(),
  body('nextDueDate').optional({ nullable: true }).isISO8601(),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
  body('status').optional().isIn(statuses),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  handleValidationErrors,
];

const updateMaintenanceValidation = [
  body('title').optional().trim().isLength({ max: 300 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('serviceProvider').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('maintenanceDate').optional({ nullable: true }).isISO8601(),
  body('nextDueDate').optional({ nullable: true }).isISO8601(),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
  body('status').optional().isIn(statuses),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  handleValidationErrors,
];

module.exports = { createMaintenanceValidation, updateMaintenanceValidation, maintenanceIdValidation };
