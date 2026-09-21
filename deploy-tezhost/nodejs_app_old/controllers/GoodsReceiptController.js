'use strict';
const goodsReceiptService = require('../services/GoodsReceiptService');
const { validationResult } = require('express-validator');
const { GoodsReceiptDTO } = require('../dto/GoodsReceiptDTO');
const EmailSetting = require('../models/EmailSetting');
const EmailService = require('../services/EmailService');

class GoodsReceiptController {
  async list(req, res, next) {
    try {
      const { tenantId } = req.user;
      const query = req.query;
      const result = await goodsReceiptService.list(tenantId, query);
      res.json({
        success: true,
        data: result.data,
        count: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const result = await goodsReceiptService.getById(tenantId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { tenantId, id: userId } = req.user;
      const result = await goodsReceiptService.create(tenantId, req.body, userId);
      res.status(201).json({ success: true, data: result, message: 'Goods Receipt created' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await goodsReceiptService.update(tenantId, id, req.body, userId);
      res.json({ success: true, data: result, message: 'Goods Receipt updated' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const result = await goodsReceiptService.delete(tenantId, id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async approve(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await goodsReceiptService.approve(tenantId, id, userId);
      res.json({ success: true, data: result, message: 'Goods Receipt approved and inventory updated' });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await goodsReceiptService.cancel(tenantId, id, userId);
      res.json({ success: true, data: result, message: 'Goods Receipt cancelled' });
    } catch (err) {
      next(err);
    }
  }
  async sendEmail(req, res, next) {
    try {
      const { tenantId } = req.user;
      const id = req.params.id;
      const { to, subject, body, pdfBase64 } = req.body;
      if (!to) return res.status(400).json({ success: false, message: 'Recipient email is required' });
      if (!pdfBase64) return res.status(400).json({ success: false, message: 'PDF attachment is required' });
      const grn = await goodsReceiptService.getById(tenantId, id);
      if (!grn) return res.status(404).json({ success: false, message: 'Goods Receipt not found' });
      const settings = await EmailSetting.findOne({ where: { tenantId } });
      if (!settings || !settings.smtpHost) return res.status(400).json({ success: false, message: 'SMTP not configured' });
      const result = await EmailService.sendInvoiceEmail(settings, {
        to, subject: subject || `Goods Receipt #${grn.grnNumber || ''}`,
        body, pdfBase64, invoiceNumber: grn.grnNumber || '',
        customerName: grn.supplierName || grn.supplier?.name || '',
      });
      res.json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new GoodsReceiptController();