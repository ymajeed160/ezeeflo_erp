const Joi = require('joi');

const purchaseRequestDetailSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.guid': 'Item must be a valid UUID',
    'any.required': 'Item is required',
  }),
  description: Joi.string().max(255).allow(null, '').messages({
    'string.max': 'Description cannot exceed 255 characters',
  }),
  quantity: Joi.number().min(0).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity cannot be negative',
    'any.required': 'Quantity is required',
  }),
  requiredDate: Joi.date().iso().allow(null).messages({
    'date.iso': 'Required date must be a valid ISO date',
  }),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const createSchema = Joi.object({
  requestDate: Joi.date().iso().required().messages({
    'date.iso': 'Request date must be a valid ISO date',
    'any.required': 'Request date is required',
  }),
  requestedBy: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Requested by cannot exceed 100 characters',
  }),
  department: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Department cannot exceed 100 characters',
  }),
  notes: Joi.string().allow(null, '').messages({
    'string.base': 'Notes must be a string',
  }),
  details: Joi.array().items(purchaseRequestDetailSchema).min(1).required().messages({
    'array.min': 'At least one detail line is required',
    'any.required': 'Details are required',
  }),
});

const updateSchema = Joi.object({
  requestDate: Joi.date().iso().messages({
    'date.iso': 'Request date must be a valid ISO date',
  }),
  requestedBy: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Requested by cannot exceed 100 characters',
  }),
  department: Joi.string().max(100).allow(null, '').messages({
    'string.max': 'Department cannot exceed 100 characters',
  }),
  notes: Joi.string().allow(null, '').messages({
    'string.base': 'Notes must be a string',
  }),
  details: Joi.array().items(purchaseRequestDetailSchema).min(1).messages({
    'array.min': 'At least one detail line is required',
  }),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected', 'converted').required().messages({
    'any.only': 'Status must be one of: draft, submitted, approved, rejected, converted',
    'any.required': 'Status is required',
  }),
});

module.exports = {
  validateCreate: (data) => createSchema.validate(data, { abortEarly: false }),
  validateUpdate: (data) => updateSchema.validate(data, { abortEarly: false }),
  validateStatus: (data) => statusSchema.validate(data, { abortEarly: false }),
};