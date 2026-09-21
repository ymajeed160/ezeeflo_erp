const campaignService = require('../services/CampaignService');
const ApiResponse = require('../utils/apiResponse');

class CampaignController {
  async getAll(req, res, next) {
    try {
      const result = await campaignService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }
  async getById(req, res, next) {
    try { return ApiResponse.success(res, { data: await campaignService.getById(req.params.id, req.user.companyId) }); } catch (error) { next(error); }
  }
  async create(req, res, next) {
    try { return ApiResponse.created(res, { data: await campaignService.create(req.body, req.user.companyId), message: 'Campaign created' }); } catch (error) { next(error); }
  }
  async update(req, res, next) {
    try { return ApiResponse.success(res, { data: await campaignService.update(req.params.id, req.body, req.user.companyId), message: 'Campaign updated' }); } catch (error) { next(error); }
  }
  async delete(req, res, next) {
    try { await campaignService.delete(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Campaign deleted' }); } catch (error) { next(error); }
  }
  async updateStatus(req, res, next) {
    try {
      const campaign = await campaignService.updateStatus(req.params.id, req.body.status, req.user.companyId);
      return ApiResponse.success(res, { data: campaign, message: `Campaign ${req.body.status}` });
    } catch (error) { next(error); }
  }
  async getActive(req, res, next) {
    try { return ApiResponse.success(res, { data: await campaignService.getActiveCampaigns(req.user.companyId) }); } catch (error) { next(error); }
  }
}

module.exports = new CampaignController();
