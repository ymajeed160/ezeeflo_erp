'use strict';

const Joi = require('joi');

const purchaseReturnDetailSchema = Joi.object({
  id: Joi.number().integer().optional(),
  itemId: Joi.number().integer().required(),
  description: Joi.string().max(255).allow(null, '').optional(),
  quantity: Joi.number().min(0.0001).required(),
  unitCost: Joi.number().min(0).required(),
  taxRate: Joi.number().min(0).max(100).default(0),
  discountAmount: Joi.number().min(0).default(0),
  lineTotal: Joi.number().min(0).required(),
  warehouseId: Joi.number().integer().allow(null).optional()
});

const createSchema = Joi.object({
  returnDate: Joi.date().iso().required(),
  supplierId: Joi.number().integer().required(),
  purchaseInvoiceId: Joi.number().integer().allow(null).optional(),
  goodsReceiptId: Joi.number().integer().allow(null).optional(),
  referenceType: Joi.string().valid('purchase_invoice', 'goods_receipt').required(),
  warehouseId: Joi.number().integer().allow(null).optional(),
  notes: Joi.string().allow('', null).optional(),
  details: Joi.array().items(purchaseReturnDetailSchema).min(1).required()
});

const updateSchema = Joi.object({
  returnDate: Joi.date().iso().optional(),
  supplierId: Joi.number().integer().optional(),
  purchaseInvoiceId: Joi.number().integer().allow(null).optional(),
  goodsReceiptId: Joi.number().integer().allow(null).optional(),
  referenceType: Joi.string().valid('purchase_invoice', 'goods_receipt').optional(),
  warehouseId: Joi.number().integer().allow(null).optional(),
  status: Joi.string().valid('Draft', 'Approved', 'Rejected').optional(),
  notes: Joi.string().allow('', null).optional(),
  details: Joi.array().items(purchaseReturnDetailSchema).min(1).optional()
});

const approveSchema = Joi.object({});

const rejectSchema = Joi.object({
  reason: Joi.string().optional().allow('', null)
});

module.exports = {
  validateCreate: (data) => createSchema.validate(data, { abortEarly: false, stripUnknown: true }),
  validateUpdate: (data) => updateSchema.validate(data, { abortEarly: false, stripUnknown: true }),
  validateApprove: (data) => approveSchema.validate(data, { abortEarly: false, stripUnknown: true }),
  validateReject: (data) => rejectSchema.validate(data, { abortEarly: false, stripUnknown: true })
};