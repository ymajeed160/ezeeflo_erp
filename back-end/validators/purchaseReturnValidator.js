'use strict';

const Joi = require('joi');

// Models use UUID primary keys. Accept UUID strings for all IDs.
const uuid = () => Joi.string().guid({ version: ['uuidv4'] }).allow(null);

const purchaseReturnDetailSchema = Joi.object({
  id: uuid().optional(),
  purchaseInvoiceLineId: uuid().optional(),
  itemId: Joi.string().guid({ version: ['uuidv4'] }).required(),
  description: Joi.string().max(255).allow(null, '').optional(),
  quantity: Joi.number().min(0.0001).required(),
  unitCost: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).default(0),
  discountAmount: Joi.number().min(0).default(0),
  lineTotal: Joi.number().min(0).optional(),
  warehouseId: uuid().optional()
});

const createSchema = Joi.object({
  returnDate: Joi.date().iso().required(),
  supplierId: uuid().optional(),
  purchaseInvoiceId: uuid().optional(),
  goodsReceiptId: uuid().optional(),
  referenceType: Joi.string().valid('purchase_invoice', 'goods_receipt').required(),
  warehouseId: uuid().optional(),
  notes: Joi.string().allow('', null).optional(),
  details: Joi.array().items(purchaseReturnDetailSchema).min(1).required()
});

const updateSchema = Joi.object({
  returnDate: Joi.date().iso().optional(),
  supplierId: uuid().optional(),
  purchaseInvoiceId: uuid().optional(),
  goodsReceiptId: uuid().optional(),
  referenceType: Joi.string().valid('purchase_invoice', 'goods_receipt').optional(),
  warehouseId: uuid().optional(),
  status: Joi.string().valid('draft', 'approved', 'rejected', 'posted', 'reversed').optional(),
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