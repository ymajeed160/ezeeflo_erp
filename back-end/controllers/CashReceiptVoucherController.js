'use strict';
const CRVService = require('../services/CashReceiptVoucherService');
const CRVDTO = require('../dto/CashReceiptVoucherDTO');
const { validationResult } = require('express-validator');

class CashReceiptVoucherController {
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
      const result = await CRVService.list(tenantId, filters);
      res.json({
        success: true,
        data: result.rows.map(v => CRVDTO.toList(v)),
        total: result.count,
      });
    } catch (err) { next(err); }
  }

  static async getById(req, res, next) {
    try {
      const voucher = await CRVService.getById(req.params.id, req.user.tenantId);
      res.json({ success: true, data: CRVDTO.toDetail(voucher) });
    } catch (err) { next(err); }
  }

  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const voucher = await CRVService.create(req.user.tenantId, req.body, req.user.id);
      res.status(201).json({ success: true, data: CRVDTO.toDetail(voucher), message: 'CRV created' });
    } catch (err) { next(err); }
  }

  static async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const voucher = await CRVService.update(req.params.id, req.user.tenantId, req.body, req.user.id);
      res.json({ success: true, data: CRVDTO.toDetail(voucher), message: 'CRV updated' });
    } catch (err) { next(err); }
  }

  static async delete(req, res, next) {
    try {
      const result = await CRVService.delete(req.params.id, req.user.tenantId, req.user.id, req.body?.reason);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  static async post(req, res, next) {
    try {
      const voucher = await CRVService.post(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CRVDTO.toDetail(voucher), message: 'CRV posted' });
    } catch (err) { next(err); }
  }

  static async reverse(req, res, next) {
    try {
      const voucher = await CRVService.reverse(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CRVDTO.toDetail(voucher), message: 'CRV reversed' });
    } catch (err) { next(err); }
  }

  static async cancel(req, res, next) {
    try {
      const voucher = await CRVService.cancel(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: CRVDTO.toDetail(voucher), message: 'CRV cancelled' });
    } catch (err) { next(err); }
  }
}

module.exports = CashReceiptVoucherController;
