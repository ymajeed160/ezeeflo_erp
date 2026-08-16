'use strict';
const Joi = require('joi');

exports.createPurchaseOrder = Joi.object({
  orderDate: Joi.date().iso().required(),
  expectedDeliveryDate: Joi.date().iso().optional().allow(null),
  supplierId: Joi.string().guid().optional().allow(null),
  purchaseRequestId: Joi.string().guid().optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(null, ''),
  details: Joi.array().min(1).items(
    Joi.object({
      itemId: Joi.string().guid().required(),
      description: Joi.string().max(500).optional().allow(null, ''),
      quantity: Joi.number().min(0.0001).required(),
      unitPrice: Joi.number().min(0).required(),
      taxPercent: Joi.number().min(0).max(100).default(0),
      discountPercent: Joi.number().min(0).max(100).default(0),
      discountAmount: Joi.number().min(0).default(0),
      sortOrder: Joi.number().integer().min(0).optional(),
    })
  ).required(),
});

exports.updatePurchaseOrder = Joi.object({
  orderDate: Joi.date().iso().optional(),
  expectedDeliveryDate: Joi.date().iso().optional().allow(null),
  supplierId: Joi.string().guid().optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(null, ''),
  details: Joi.array().min(1).items(
    Joi.object({
      id: Joi.string().guid().optional(),
      itemId: Joi.string().guid().required(),
      description: Joi.string().max(500).optional().allow(null, ''),
      quantity: Joi.number().min(0.0001).required(),
      unitPrice: Joi.number().min(0).required(),
      taxPercent: Joi.number().min(0).max(100).default(0),
      discountPercent: Joi.number().min(0).max(100).default(0),
      discountAmount: Joi.number().min(0).default(0),
      sortOrder: Joi.number().integer().min(0).optional(),
    })
  ).optional(),
}).min(1);

exports.approve = Joi.object({
  decision: Joi.string().valid('approved', 'cancelled').required(),
  remarks: Joi.string().max(1000).optional().allow(null, ''),
});