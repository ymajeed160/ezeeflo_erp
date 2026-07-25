const warehouseService = require('../services/WarehouseService');
const WarehouseDTO = require('../dto/WarehouseDTO');
const ApiResponse = require('../utils/apiResponse');

class WarehouseController {
  /**
   * GET /api/warehouses
   */
  async getWarehouses(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await warehouseService.getWarehouses(tenantId, query);

      return ApiResponse.paginated(res, {
        data: WarehouseDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Warehouses retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/warehouses/active
   */
  async getActiveWarehouses(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const warehouses = await warehouseService.getActiveWarehouses(tenantId);
      return ApiResponse.success(res, {
        data: WarehouseDTO.toCompactListResponse(warehouses),
        message: 'Active warehouses retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/warehouses/:id
   */
  async getWarehouseById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const warehouse = await warehouseService.getWarehouseById(id, tenantId);
      return ApiResponse.success(res, {
        data: WarehouseDTO.toResponse(warehouse),
        message: 'Warehouse retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/warehouses
   */
  async createWarehouse(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      const warehouse = await warehouseService.createWarehouse(req.body, tenantId);
      return ApiResponse.created(res, {
        data: WarehouseDTO.toResponse(warehouse),
        message: 'Warehouse created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/warehouses/:id
   */
  async updateWarehouse(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const warehouse = await warehouseService.updateWarehouse(id, req.body, tenantId);
      return ApiResponse.success(res, {
        data: WarehouseDTO.toResponse(warehouse),
        message: 'Warehouse updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/warehouses/:id
   */
  async deleteWarehouse(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await warehouseService.deleteWarehouse(id, tenantId);
      return ApiResponse.success(res, {
        message: 'Warehouse deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/warehouses/:id/toggle-status
   */
  async toggleWarehouseStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const warehouse = await warehouseService.toggleStatus(id, tenantId);
      return ApiResponse.success(res, {
        data: WarehouseDTO.toResponse(warehouse),
        message: 'Warehouse status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WarehouseController();