'use strict';
const CPVService = require('../services/CashPaymentVoucherService');
const CPVDTO = require('../dto/CashPaymentVoucherDTO');
const { validationResult } = require('express-validator');

class CashPaymentVoucherController {
  static async list(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        cashAccountId: req.query.cashAccountId,
        search: req.query.search,
        limit: req.query.limit || 20,
        offset: req.query.offset || 0,
      };
      const result = await CPVService.list(tenantId, filters);
      res.json({
        success: true,
        data: result.rows.map(v => CPVDTO.toList(v)),
        total: result.count,
      });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const voucher = await CPVService.getById(req.params.id, req.user.tenantId);
      res.json({ success: true, data: CPVDTO.toDetail(voucher) });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const voucher = await CPVService.create(req.user.tenantId, req.body, req.user.id);
      res.status(201).json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV created' });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const voucher = await CPVService.update(req.params.id, req.user.tenantId, req.body, req.user.id);
      res.json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV updated' });
    } catch (err) { next(err); }
  }

  static async post(req, res, next) {
    try {
      const voucher = await CPVService.post(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV posted successfully' });
    } catch (err) { next(err); }
  }

  static async reverse(req, res, next) {
    try {
      const voucher = await CPVService.reverse(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV reversed successfully' });
    } catch (err) { next(err); }
  }

  static async cancel(req, res, next) {
    try {
      const voucher = await CPVService.cancel(req.params.id, req.user.tenantId, req.user.id, req.body?.reason);
      res.json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV cancelled' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      await CPVService.delete(req.params.id, req.user.tenantId, req.user.id, req.body?.reason);
      res.json({ success: true, message: 'CPV deleted' });
    } catch (err) { next(err); }
  }

  static async restore(req, res, next) {
    try {
      const voucher = await CPVService.restore(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CPVDTO.toDetail(voucher), message: 'CPV restored' });
    } catch (err) { next(err); }
  }
}

module.exports = CashPaymentVoucherController;
