'use strict';
const PurchaseOrderService = require('../services/PurchaseOrderService');
const ApiResponse = require('../utils/apiResponse');
const EmailSetting = require('../models/EmailSetting');
const EmailService = require('../services/EmailService');

class PurchaseOrderController {
  async getAll(req, res, next) {
    try {
      const result = await PurchaseOrderService.getAll(req.user.tenantId, req.query);
      return ApiResponse.success(res, { message: 'Purchase Orders fetched successfully', data: result });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await PurchaseOrderService.getById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Purchase Order fetched successfully', data: result });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const result = await PurchaseOrderService.create(req.body, req.user.id, req.user.tenantId);
      return ApiResponse.created(res, { message: 'Purchase Order created successfully', data: result });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await PurchaseOrderService.update(req.params.id, req.body, req.user.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Purchase Order updated successfully', data: result });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      const result = await PurchaseOrderService.delete(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Purchase Order deleted successfully', data: result });
    } catch (error) { next(error); }
  }

  async approve(req, res, next) {
    try {
      const { decision } = req.body;
      const result = await PurchaseOrderService.approve(req.params.id, decision, req.user.id, req.user.tenantId);
      return ApiResponse.success(res, { message: `Purchase Order ${decision} successfully`, data: result });
    } catch (error) { next(error); }
  }

  async getOutstandingPOs(req, res, next) {
    try {
      const { supplierId } = req.query;
      const result = await PurchaseOrderService.getOutstandingPOs(req.user.tenantId, supplierId || null);
      return ApiResponse.success(res, { message: 'Outstanding Purchase Orders fetched successfully', data: result });
    } catch (error) { next(error); }
  }

  async generateFromPR(req, res, next) {
    try {
      const { purchaseRequestIds, purchaseRequestId } = req.body;
      const ids = purchaseRequestIds || (purchaseRequestId ? [purchaseRequestId] : []);
      if (!ids.length) {
        return ApiResponse.badRequest(res, { message: 'No Purchase Request IDs provided' });
      }
      const results = [];
      for (const id of ids) {
        const result = await PurchaseOrderService.generateFromPurchaseRequest(id, req.user.id, req.user.tenantId);
        results.push(result);
      }
      return ApiResponse.created(res, {
        message: `${results.length} Purchase Order(s) generated successfully`,
        data: results.length === 1 ? results[0] : results,
      });
    } catch (error) { next(error); }
  }

  async sendEmail(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const id = req.params.id;
      const { to, subject, body, pdfBase64 } = req.body;
      if (!to) return res.status(400).json({ success: false, message: 'Recipient email is required' });
      if (!pdfBase64) return res.status(400).json({ success: false, message: 'PDF attachment is required' });
      const order = await PurchaseOrderService.getById(id, tenantId);
      if (!order) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      const settings = await EmailSetting.findOne({ where: { tenantId } });
      if (!settings || !settings.smtpHost) return res.status(400).json({ success: false, message: 'SMTP not configured' });
      const result = await EmailService.sendInvoiceEmail(settings, {
        to, subject: subject || `Purchase Order #${order.orderNumber}`,
        body, pdfBase64, invoiceNumber: order.orderNumber,
        customerName: order.supplier?.name || '',
      });
      res.json(result);
    } catch (error) { next(error); }
  }
}

module.exports = new PurchaseOrderController();