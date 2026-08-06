const notificationService = require('../services/NotificationService');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  async getTemplates(req, res, next) { try { return ApiResponse.success(res, { data: await notificationService.getTemplates(req.user.companyId) }); } catch(e) { next(e); } }
  async createTemplate(req, res, next) { try { return ApiResponse.created(res, { data: await notificationService.createTemplate(req.body, req.user.companyId) }); } catch(e) { next(e); } }
  async updateTemplate(req, res, next) { try { return ApiResponse.success(res, { data: await notificationService.updateTemplate(req.params.id, req.body, req.user.companyId) }); } catch(e) { next(e); } }
  async deleteTemplate(req, res, next) { try { await notificationService.deleteTemplate(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Template deleted' }); } catch(e) { next(e); } }
  async send(req, res, next) { try { return ApiResponse.created(res, { data: await notificationService.send({ ...req.body, companyId: req.user.companyId }), message: 'Notification sent' }); } catch(e) { next(e); } }
  async getHistory(req, res, next) { try { const r = await notificationService.getHistory(req.user.companyId, req.query); return ApiResponse.paginated(res, { data: r.rows, pagination: r.pagination }); } catch(e) { next(e); } }
}

module.exports = new NotificationController();
