const acqService = require('../services/AssetAcquisitionService');
const AssetAcquisitionDTO = require('../dto/AssetAcquisitionDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetAcquisitionController {
  async getAcquisitions(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await acqService.getAcquisitions(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetAcquisitionDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Acquisitions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAcquisitionById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const acq = await acqService.getAcquisitionById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetAcquisitionDTO.toResponse(acq),
        message: 'Acquisition retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getNextAcquisitionNumber(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const nextNumber = await acqService.getNextAcquisitionNumber(tenantId);
      return ApiResponse.success(res, {
        data: { nextAcquisitionNumber: nextNumber },
        message: 'Next acquisition number retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createAcquisition(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const acq = await acqService.createAcquisition(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetAcquisitionDTO.toResponse(acq),
        message: 'Acquisition created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async postAcquisition(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const acq = await acqService.postAcquisition(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetAcquisitionDTO.toResponse(acq),
        message: 'Acquisition posted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async reverseAcquisition(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const acq = await acqService.reverseAcquisition(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetAcquisitionDTO.toResponse(acq),
        message: 'Acquisition reversed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAcquisition(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await acqService.deleteAcquisition(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Acquisition deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetAcquisitionController();
