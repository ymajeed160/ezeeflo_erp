const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/SupplierController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const supplierValidation = require('../validators/supplierValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get(
  '/',
  requirePermission('supplier.view'),
  supplierValidation.list,
  supplierController.getAll.bind(supplierController)
);

router.get(
  '/select',
  requirePermission('supplier.view'),
  async (req, res, next) => {
    try {
      const supplierService = require('../services/SupplierService');
      const { tenantId } = req.user;
      const suppliers = await supplierService.getForSelect(tenantId, req.query.search);
      const ApiResponse = require('../utils/apiResponse');
      return ApiResponse.success(res, { data: suppliers, message: 'Suppliers retrieved' });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  requirePermission('supplier.view'),
  supplierValidation.getById,
  supplierController.getById.bind(supplierController)
);

router.post(
  '/',
  requirePermission('supplier.create'),
  supplierValidation.create,
  supplierController.create.bind(supplierController)
);

router.put(
  '/:id',
  requirePermission('supplier.edit'),
  supplierValidation.update,
  supplierController.update.bind(supplierController)
);

router.delete(
  '/:id',
  requirePermission('supplier.delete'),
  supplierValidation.delete,
  supplierController.delete.bind(supplierController)
);

router.patch(
  '/:id/toggle-status',
  requirePermission('supplier.edit'),
  supplierValidation.toggleStatus,
  supplierController.toggleStatus.bind(supplierController)
);

module.exports = router;