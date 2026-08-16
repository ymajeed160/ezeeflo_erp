const SupplierPaymentService = require('../services/SupplierPaymentService');

class SupplierPaymentController {
  async getAll(req, res) {
    try {
      const { page, limit, search, status, supplierId, startDate, endDate, sortBy, sortOrder } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search, status, supplierId, startDate, endDate, sortBy, sortOrder
      };
      const result = await SupplierPaymentService.findAll(req.tenantId, options);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const record = await SupplierPaymentService.findById(req.tenantId, req.params.id);
      if (!record) return res.status(404).json({ success: false, message: 'Supplier Payment not found' });
      return res.json({ success: true, data: record });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const record = await SupplierPaymentService.create(req.tenantId, req.userId, req.body);
      return res.status(201).json({ success: true, message: 'Supplier Payment created', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const record = await SupplierPaymentService.update(req.tenantId, req.params.id, req.body);
      return res.json({ success: true, message: 'Supplier Payment updated', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await SupplierPaymentService.delete(req.tenantId, req.params.id);
      return res.json({ success: true, message: 'Supplier Payment deleted' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async confirm(req, res) {
    try {
      const record = await SupplierPaymentService.confirm(req.tenantId, req.userId, req.params.id);
      return res.json({ success: true, message: 'Supplier Payment confirmed', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async postToJournal(req, res) {
    try {
      const record = await SupplierPaymentService.postToJournal(req.tenantId, req.userId, req.params.id);
      return res.json({ success: true, message: 'Supplier Payment posted to journal', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SupplierPaymentController();