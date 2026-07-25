const stockTransferService = require('../services/StockTransferService');
const StockTransferDTO = require('../dto/StockTransferDTO');
const ApiResponse = require('../utils/apiResponse');

class StockTransferController {
  /**
   * GET /api/stock-transfers
   */
  async getTransfers(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await stockTransferService.getTransfers(tenantId, query);

      return ApiResponse.paginated(res, {
        data: StockTransferDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Stock transfers retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stock-transfers/:id
   */
  async getTransferById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const transfer = await stockTransferService.getTransferById(id, tenantId);
      return ApiResponse.success(res, {
        data: StockTransferDTO.toResponse(transfer),
        message: 'Stock transfer retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/stock-transfers
   */
  async createTransfer(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const transfer = await stockTransferService.createTransfer(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: StockTransferDTO.toResponse(transfer),
        message: 'Stock transfer created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/stock-transfers/:id/status
   */
  async updateTransferStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const transfer = await stockTransferService.updateTransferStatus(id, status, tenantId, userId);
      return ApiResponse.success(res, {
        data: StockTransferDTO.toResponse(transfer),
        message: 'Stock transfer status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StockTransferController();