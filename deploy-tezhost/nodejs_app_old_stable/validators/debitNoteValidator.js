const Joi = require('joi');

const createDebitNoteSchema = Joi.object({
  debitNoteDate: Joi.date().iso().required(),
  supplierId: Joi.number().integer().positive().required(),
  purchaseReturnId: Joi.number().integer().positive().allow(null).optional(),
  referenceType: Joi.string().valid('PurchaseReturn', 'Manual').default('Manual'),
  referenceId: Joi.number().integer().positive().allow(null).optional(),
  amount: Joi.number().precision(2).min(0).required(),
  notes: Joi.string().max(2000).allow('', null).optional()
});

const updateDebitNoteSchema = Joi.object({
  debitNoteDate: Joi.date().iso().optional(),
  supplierId: Joi.number().integer().positive().optional(),
  purchaseReturnId: Joi.number().integer().positive().allow(null).optional(),
  referenceType: Joi.string().valid('PurchaseReturn', 'Manual').optional(),
  referenceId: Joi.number().integer().positive().allow(null).optional(),
  amount: Joi.number().precision(2).min(0).optional(),
  notes: Joi.string().max(2000).allow('', null).optional()
});

const approveDebitNoteSchema = Joi.object({
  // No specific fields required for approval
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }
  req.body = value;
  next();
};

module.exports = {
  validateCreate: validate(createDebitNoteSchema),
  validateUpdate: validate(updateDebitNoteSchema),
  validateApprove: validate(approveDebitNoteSchema)
};