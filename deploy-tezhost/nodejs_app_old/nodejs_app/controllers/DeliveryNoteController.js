'use strict';

const deliveryNoteService = require('../services/DeliveryNoteService');
const { deliveryNoteDTO } = require('../dto/DeliveryNoteDTO');

const DeliveryNoteController = {
  /**
   * GET /api/delivery-notes
   * List delivery notes with pagination
   */
  async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await deliveryNoteService.list(req.query, tenantId);
      return res.json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/delivery-notes/:id
   * Get delivery note by ID
   */
  async getById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const data = await deliveryNoteService.getById(id, tenantId);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/delivery-notes/next-number
   * Generate next delivery number
   */
  async getNextNumber(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const number = await deliveryNoteService.generateNumber(tenantId);
      return res.json({ success: true, data: { deliveryNumber: number } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/delivery-notes
   * Create delivery note
   */
  async create(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const data = await deliveryNoteService.create(req.body, userId, tenantId);
      return res.status(201).json({ success: true, data, message: 'Delivery note created successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/delivery-notes/generate-from-sales-order
   * Generate delivery note from sales order
   */
  async generateFromSalesOrder(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const data = await deliveryNoteService.generateFromSalesOrder(req.body, userId, tenantId);
      return res.status(201).json({ success: true, data, message: 'Delivery note generated from sales order successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/delivery-notes/:id
   * Update delivery note
   */
  async update(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const userId = req.user.id;
      const data = await deliveryNoteService.update(id, req.body, userId, tenantId);
      return res.json({ success: true, data, message: 'Delivery note updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/delivery-notes/:id
   * Delete delivery note
   */
  async delete(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const result = await deliveryNoteService.delete(id, tenantId);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/delivery-notes/:id/status
   * Update delivery note status
   */
  async updateStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const data = await deliveryNoteService.updateStatus(id, status, userId, tenantId);
      return res.json({ success: true, data, message: `Delivery note status updated to ${status}` });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/delivery-notes/by-sales-order/:salesOrderId
   * Get deliveries for a sales order
   */
  async getBySalesOrder(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { salesOrderId } = req.params;
      const data = await deliveryNoteService.getBySalesOrder(salesOrderId, tenantId);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DeliveryNoteController;