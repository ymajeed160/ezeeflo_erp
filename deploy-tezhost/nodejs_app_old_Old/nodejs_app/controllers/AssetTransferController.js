const transferService = require('../services/AssetTransferService');
const AssetTransferDTO = require('../dto/AssetTransferDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetTransferController {
  async getTransfers(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await transferService.getTransfers(tenantId, req.query);
      return ApiResponse.paginated(res, { data: AssetTransferDTO.toListResponse(result.rows), pagination: result.pagination, message: 'Transfers retrieved successfully' });
    } catch (error) { next(error); }
  }

  async getTransferById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const transfer = await transferService.getTransferById(req.params.id, tenantId);
      return ApiResponse.success(res, { data: AssetTransferDTO.toResponse(transfer), message: 'Transfer retrieved successfully' });
    } catch (error) { next(error); }
  }

  async getNextTransferNumber(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const nextNumber = await transferService.getNextTransferNumber(tenantId);
      return ApiResponse.success(res, { data: { nextTransferNumber: nextNumber }, message: 'Next transfer number retrieved' });
    } catch (error) { next(error); }
  }

  async getTransferHistory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const transfers = await transferService.getTransferHistory(req.params.assetId, tenantId);
      return ApiResponse.success(res, { data: AssetTransferDTO.toListResponse(transfers), message: 'Transfer history retrieved' });
    } catch (error) { next(error); }
  }

  async createTransfer(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const transfer = await transferService.createTransfer(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: AssetTransferDTO.toResponse(transfer), message: 'Transfer created successfully' });
    } catch (error) { next(error); }
  }

  async deleteTransfer(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await transferService.deleteTransfer(req.params.id, tenantId);
      return ApiResponse.success(res, { message: 'Transfer deleted successfully' });
    } catch (error) { next(error); }
  }
}

module.exports = new AssetTransferController();
