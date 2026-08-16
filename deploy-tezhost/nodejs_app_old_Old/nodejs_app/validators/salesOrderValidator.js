'use strict';
const Joi = require('joi');

const detailSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'Item is required',
    'any.required': 'Item is required',
  }),
  description: Joi.string().max(255).allow('', null),
  quantity: Joi.number().positive().required().messages({
    'number.base': 'Quantity must be a number',
    'number.positive': 'Quantity must be greater than 0',
    'any.required': 'Quantity is required',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'number.base': 'Unit price must be a number',
    'number.min': 'Unit price cannot be negative',
    'any.required': 'Unit price is required',
  }),
  taxPercentage: Joi.number().min(0).max(100).default(0),
  discountPercentage: Joi.number().min(0).max(100).default(0),
});

const createSchema = Joi.object({
  customerId: Joi.string().uuid().required().messages({
    'string.guid': 'Customer is required',
    'any.required': 'Customer is required',
  }),
  quotationId: Joi.string().uuid().allow(null, ''),
  warehouseId: Joi.string().uuid().allow(null, ''),
  orderDate: Joi.date().required().messages({
    'date.base': 'Order date is required',
    'any.required': 'Order date is required',
  }),
  deliveryDate: Joi.date().allow(null, ''),
  reference: Joi.string().max(100).allow('', null),
  notes: Joi.string().allow('', null),
  termsConditions: Joi.string().allow('', null),
  status: Joi.string().valid('draft', 'approved').default('draft'),
  details: Joi.array().items(detailSchema).min(1).required().messages({
    'array.min': 'At least one line item is required',
    'any.required': 'Line items are required',
  }),
});

const updateSchema = Joi.object({
  customerId: Joi.string().uuid(),
  quotationId: Joi.string().uuid().allow(null, ''),
  warehouseId: Joi.string().uuid().allow(null, ''),
  orderDate: Joi.date(),
  deliveryDate: Joi.date().allow(null, ''),
  reference: Joi.string().max(100).allow('', null),
  notes: Joi.string().allow('', null),
  termsConditions: Joi.string().allow('', null),
  status: Joi.string().valid('draft', 'approved', 'partially_delivered', 'delivered', 'closed'),
  details: Joi.array().items(detailSchema).min(1),
}).min(1);

const approveSchema = Joi.object({});

class SalesOrderValidator {
  static validateCreate(data) {
    const { error, value } = createSchema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      throw { status: 400, message: errors.join('; ') };
    }
    return value;
  }

  static validateUpdate(data) {
    const { error, value } = updateSchema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      throw { status: 400, message: errors.join('; ') };
    }
    return value;
  }

  static validateApprove(data) {
    const { error, value } = approveSchema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      throw { status: 400, message: errors.join('; ') };
    }
    return value;
  }
}

module.exports = SalesOrderValidator;