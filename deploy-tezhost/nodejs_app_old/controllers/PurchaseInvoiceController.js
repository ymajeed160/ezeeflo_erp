'use strict';

const purchaseInvoiceService = require('../services/PurchaseInvoiceService');
const PurchaseInvoiceDTO = require('../dto/PurchaseInvoiceDTO');
const EmailSetting = require('../models/EmailSetting');
const EmailService = require('../services/EmailService');

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
  async sendEmail(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const { to, subject, body, pdfBase64 } = req.body;
      if (!to) return res.status(400).json({ success: false, message: 'Recipient email is required' });
      if (!pdfBase64) return res.status(400).json({ success: false, message: 'PDF attachment is required' });
      const invoice = await purchaseInvoiceService.getById(id, tenantId);
      if (!invoice) return res.status(404).json({ success: false, message: 'Purchase Invoice not found' });
      const settings = await EmailSetting.findOne({ where: { tenantId } });
      if (!settings || !settings.smtpHost) return res.status(400).json({ success: false, message: 'SMTP not configured' });
      const invNo = invoice.invoiceNumber || invoice.invoiceNo || '';
      const result = await EmailService.sendInvoiceEmail(settings, {
        to, subject: subject || `Purchase Invoice #${invNo}`,
        body, pdfBase64, invoiceNumber: invNo,
        customerName: invoice.supplier?.name || '',
      });
      res.json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new PurchaseInvoiceController();