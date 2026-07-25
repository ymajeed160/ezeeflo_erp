const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const customerValidation = require('../validators/customerValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /customers - List customers
router.get(
  '/',
  requirePermission('customer.view'),
  customerValidation.list,
  customerController.getAll.bind(customerController)
);

// GET /customers - List active customers for select/dropdown
router.get(
  '/select',
  requirePermission('customer.view'),
  async (req, res, next) => {
    try {
      const customerService = require('../services/CustomerService');
      const { tenantId } = req.user;
      const customers = await customerService.getForSelect(tenantId, req.query.search);
      const ApiResponse = require('../utils/apiResponse');
      return ApiResponse.success(res, { data: customers, message: 'Customers retrieved' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /customers/:id - Get customer by ID
router.get(
  '/:id',
  requirePermission('customer.view'),
  customerValidation.getById,
  customerController.getById.bind(customerController)
);

// POST /customers - Create customer
router.post(
  '/',
  requirePermission('customer.create'),
  customerValidation.create,
  customerController.create.bind(customerController)
);

// PUT /customers/:id - Update customer
router.put(
  '/:id',
  requirePermission('customer.edit'),
  customerValidation.update,
  customerController.update.bind(customerController)
);

// DELETE /customers/:id - Delete customer
router.delete(
  '/:id',
  requirePermission('customer.delete'),
  customerValidation.delete,
  customerController.delete.bind(customerController)
);

// PATCH /customers/:id/toggle-status - Toggle active/inactive
router.patch(
  '/:id/toggle-status',
  requirePermission('customer.edit'),
  customerValidation.toggleStatus,
  customerController.toggleStatus.bind(customerController)
);

module.exports = router;