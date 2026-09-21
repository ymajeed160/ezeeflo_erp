const purchaseRequestService = require('../services/PurchaseRequestService');
const { validateCreate, validateUpdate, validateStatus } = require('../validators/purchaseRequestValidator');

class PurchaseRequestController {
  async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await purchaseRequestService.list(tenantId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data = await purchaseRequestService.getById(tenantId, id);
      if (!data) return res.status(404).json({ success: false, message: 'Purchase Request not found' });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { error, value } = validateCreate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(d => d.message),
        });
      }
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const data = await purchaseRequestService.create(tenantId, value, userId);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { error, value } = validateUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(d => d.message),
        });
      }
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = await purchaseRequestService.update(tenantId, id, value, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      await purchaseRequestService.delete(tenantId, id, userId);
      res.json({ success: true, message: 'Purchase Request deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { error, value } = validateStatus(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(d => d.message),
        });
      }
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = await purchaseRequestService.updateStatus(tenantId, id, value.status, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async submit(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = await purchaseRequestService.submit(tenantId, id, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = await purchaseRequestService.approve(tenantId, id, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = await purchaseRequestService.reject(tenantId, id, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseRequestController();