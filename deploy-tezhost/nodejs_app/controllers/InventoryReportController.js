const inventoryReportService = require('../services/InventoryReportService');
const InventoryBalanceDTO = require('../dto/InventoryBalanceDTO');
const InventoryTransactionDTO = require('../dto/InventoryTransactionDTO');
const ApiResponse = require('../utils/apiResponse');

class InventoryReportController {
  /**
   * GET /api/inventory/balances
   */
  async getInventoryBalances(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await inventoryReportService.getInventoryBalances(tenantId, query);

      return ApiResponse.paginated(res, {
        data: InventoryBalanceDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Inventory balances retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/balances/:warehouseId/:itemId
   */
  async getBalanceByWarehouseAndItem(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { warehouseId, itemId } = req.params;

      const balance = await inventoryReportService.getBalanceByWarehouseAndItem(warehouseId, itemId, tenantId);
      return ApiResponse.success(res, {
        data: InventoryBalanceDTO.toResponse(balance),
        message: 'Inventory balance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/transactions
   */
  async getTransactionHistory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await inventoryReportService.getTransactionHistory(tenantId, query);

      return ApiResponse.paginated(res, {
        data: InventoryTransactionDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Inventory transactions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/inventory/items/:itemId/movement-summary
   */
  async getItemMovementSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { itemId } = req.params;
      const query = req.query;

      const summary = await inventoryReportService.getItemMovementSummary(itemId, tenantId, query);
      return ApiResponse.success(res, {
        data: summary,
        message: 'Item movement summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryReportController();