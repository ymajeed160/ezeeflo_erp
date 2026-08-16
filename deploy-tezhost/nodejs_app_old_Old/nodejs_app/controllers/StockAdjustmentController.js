const stockAdjustmentService = require('../services/StockAdjustmentService');
const StockAdjustmentDTO = require('../dto/StockAdjustmentDTO');
const ApiResponse = require('../utils/apiResponse');

class StockAdjustmentController {
  /**
   * GET /api/stock-adjustments
   */
  async getAdjustments(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await stockAdjustmentService.getAdjustments(tenantId, query);

      return ApiResponse.paginated(res, {
        data: StockAdjustmentDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Stock adjustments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stock-adjustments/:id
   */
  async getAdjustmentById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const adjustment = await stockAdjustmentService.getAdjustmentById(id, tenantId);
      return ApiResponse.success(res, {
        data: StockAdjustmentDTO.toResponse(adjustment),
        message: 'Stock adjustment retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/stock-adjustments
   */
  async createAdjustment(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const adjustment = await stockAdjustmentService.createAdjustment(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: StockAdjustmentDTO.toResponse(adjustment),
        message: 'Stock adjustment created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/stock-adjustments/:id/status
   */
  async updateAdjustmentStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const adjustment = await stockAdjustmentService.updateAdjustmentStatus(id, status, tenantId, userId);
      return ApiResponse.success(res, {
        data: StockAdjustmentDTO.toResponse(adjustment),
        message: 'Stock adjustment status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StockAdjustmentController();