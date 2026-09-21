const quotationService = require('../services/QuotationService');

class QuotationController {
  async list(req, res, next) {
    try {
      const { tenantId } = req.user;
      const result = await quotationService.list(tenantId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const quotation = await quotationService.getById(tenantId, req.params.id);
      if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
      res.json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const quotation = await quotationService.create(tenantId, req.body, userId);
      res.status(201).json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const quotation = await quotationService.update(tenantId, req.params.id, req.body, userId);
      res.json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      await quotationService.delete(tenantId, req.params.id, userId);
      res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { status } = req.body;
      const quotation = await quotationService.updateStatus(tenantId, req.params.id, status, userId);
      res.json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const quotation = await quotationService.approve(tenantId, req.params.id, userId);
      res.json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const quotation = await quotationService.reject(tenantId, req.params.id, userId);
      res.json(quotation);
    } catch (error) {
      next(error);
    }
  }

  async convertToSalesOrder(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const salesOrder = await quotationService.convertToSalesOrder(tenantId, req.params.id, userId);
      res.status(201).json(salesOrder);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuotationController();