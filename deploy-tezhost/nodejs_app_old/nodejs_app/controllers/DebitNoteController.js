const DebitNoteService = require('../services/DebitNoteService');

class DebitNoteController {
  async getAll(req, res) {
    try {
      const { page, limit, search, status, supplierId, startDate, endDate, sortBy, sortOrder } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search, status, supplierId, startDate, endDate, sortBy, sortOrder
      };
      const result = await DebitNoteService.findAll(req.tenantId, options);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const record = await DebitNoteService.findById(req.tenantId, parseInt(req.params.id));
      if (!record) return res.status(404).json({ success: false, message: 'Debit Note not found' });
      return res.json({ success: true, data: record });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const record = await DebitNoteService.create(req.tenantId, req.userId, req.body);
      return res.status(201).json({ success: true, message: 'Debit Note created', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const record = await DebitNoteService.update(req.tenantId, parseInt(req.params.id), req.body);
      return res.json({ success: true, message: 'Debit Note updated', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await DebitNoteService.delete(req.tenantId, parseInt(req.params.id));
      return res.json({ success: true, message: 'Debit Note deleted' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async approve(req, res) {
    try {
      const record = await DebitNoteService.approve(req.tenantId, req.userId, parseInt(req.params.id));
      return res.json({ success: true, message: 'Debit Note approved', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async generateFromReturn(req, res) {
    try {
      const { purchaseReturnId } = req.body;
      if (!purchaseReturnId) return res.status(400).json({ success: false, message: 'purchaseReturnId required' });
      const record = await DebitNoteService.generateFromPurchaseReturn(req.tenantId, req.userId, purchaseReturnId);
      return res.status(201).json({ success: true, message: 'Debit Note generated from Purchase Return', data: record });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DebitNoteController();