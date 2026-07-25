'use strict';

const purchaseInvoiceService = require('../services/PurchaseInvoiceService');
const PurchaseInvoiceDTO = require('../dto/PurchaseInvoiceDTO');

class PurchaseInvoiceController {
  async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const filters = req.query;
      const result = await purchaseInvoiceService.list(tenantId, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const result = await purchaseInvoiceService.getById(id, tenantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const data = req.body;
      const result = await purchaseInvoiceService.create(tenantId, data, userId);
      res.status(201).json({ success: true, data: result, message: 'Purchase Invoice created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const data = req.body;
      const result = await purchaseInvoiceService.update(id, tenantId, data, userId);
      res.json({ success: true, data: result, message: 'Purchase Invoice updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const result = await purchaseInvoiceService.delete(id, tenantId, userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const result = await purchaseInvoiceService.confirm(id, tenantId, userId);
      res.json({ success: true, data: result, message: 'Purchase Invoice confirmed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const accountData = req.body || {};
      const result = await purchaseInvoiceService.approve(id, tenantId, userId, accountData);
      res.json({ success: true, data: result, message: 'Purchase Invoice posted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;
      const result = await purchaseInvoiceService.cancel(id, tenantId, userId);
      res.json({ success: true, data: result, message: 'Purchase Invoice cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async generateFromPO(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { poId } = req.body;
      const result = await purchaseInvoiceService.generateFromPO(tenantId, poId, userId);
      res.status(201).json({ success: true, data: result, message: 'Purchase Invoice generated from PO successfully' });
    } catch (error) {
      next(error);
    }
  }

  async generateFromGoodsReceipt(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { grnId } = req.body;
      const result = await purchaseInvoiceService.generateFromGoodsReceipt(tenantId, grnId, userId);
      res.status(201).json({ success: true, data: result, message: 'Purchase Invoice generated from Goods Receipt successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseInvoiceController();