const Joi = require('joi');

const validateId = (req, res, next) => {
  const { error } = Joi.object({ id: Joi.string().uuid().required() }).validate(req.params);
  if (error) return res.status(400).json({ success: false, message: 'Invalid ID' }); next();
};

const fail = (res, error) => res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });

const leaveTypeValidator = {
  validateId,
  create: (req, res, next) => {
    const s = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(100).required(), nameAr: Joi.string().max(100).allow('', null),
      leaveCategory: Joi.string().valid('Annual', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Unpaid', 'Compensatory', 'Bereavement', 'Study', 'Other').required(),
      isPaid: Joi.boolean().default(true), maxDaysPerYear: Joi.number().min(0).allow(null), maxDaysPerRequest: Joi.number().min(0).allow(null),
      minDaysPerRequest: Joi.number().min(0).default(0.5), requiresApproval: Joi.boolean().default(true),
      requiresDocuments: Joi.boolean().default(false), allowNegativeBalance: Joi.boolean().default(false),
      isActive: Joi.boolean().default(true), description: Joi.string().allow('', null), color: Joi.string().max(7).allow('', null),
    });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
  update: (req, res, next) => {
    const s = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(100), nameAr: Joi.string().max(100).allow('', null),
      leaveCategory: Joi.string().valid('Annual', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Unpaid', 'Compensatory', 'Bereavement', 'Study', 'Other'),
      isPaid: Joi.boolean(), maxDaysPerYear: Joi.number().min(0).allow(null), maxDaysPerRequest: Joi.number().min(0).allow(null),
      minDaysPerRequest: Joi.number().min(0), requiresApproval: Joi.boolean(),
      requiresDocuments: Joi.boolean(), allowNegativeBalance: Joi.boolean(),
      isActive: Joi.boolean(), description: Joi.string().allow('', null), color: Joi.string().max(7).allow('', null),
    }).min(1);
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
};

const leaveAppValidator = {
  validateId,
  create: (req, res, next) => {
    const s = Joi.object({
      employeeId: Joi.string().uuid().required(), leaveTypeId: Joi.string().uuid().required(),
      startDate: Joi.date().iso().required(), endDate: Joi.date().iso().required(),
      reason: Joi.string().allow('', null), contactDetails: Joi.string().max(200).allow('', null),
      status: Joi.string().valid('Draft', 'Submitted').default('Submitted'),
    });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
  update: (req, res, next) => {
    const s = Joi.object({
      startDate: Joi.date().iso(), endDate: Joi.date().iso(), reason: Joi.string().allow('', null),
      contactDetails: Joi.string().max(200).allow('', null),
    }).min(1);
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
  reject: (req, res, next) => {
    const s = Joi.object({ reason: Joi.string().allow('', null) });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
};

const leaveBalanceValidator = {
  validateId,
  create: (req, res, next) => {
    const s = Joi.object({
      employeeId: Joi.string().uuid().required(), leaveTypeId: Joi.string().uuid().required(),
      year: Joi.number().integer().min(2020).max(2100).required(),
      openingBalance: Joi.number().min(0).default(0), accruedDays: Joi.number().min(0).default(0),
      usedDays: Joi.number().min(0).default(0), pendingDays: Joi.number().min(0).default(0),
      carryForwardDays: Joi.number().min(0).default(0), notes: Joi.string().allow('', null),
    });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
  initialize: (req, res, next) => {
    const s = Joi.object({ employeeId: Joi.string().uuid().required() });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
};

const holidayValidator = {
  validateId,
  create: (req, res, next) => {
    const s = Joi.object({
      name: Joi.string().max(150).required(), nameAr: Joi.string().max(150).allow('', null),
      holidayDate: Joi.date().iso().required(), endDate: Joi.date().iso().allow(null),
      isRecurringYearly: Joi.boolean().default(false),
      holidayType: Joi.string().valid('Public', 'Religious', 'National', 'Company').default('Public'),
      description: Joi.string().allow('', null), isActive: Joi.boolean().default(true),
    });
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
  update: (req, res, next) => {
    const s = Joi.object({
      name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      holidayDate: Joi.date().iso(), endDate: Joi.date().iso().allow(null),
      isRecurringYearly: Joi.boolean(), holidayType: Joi.string().valid('Public', 'Religious', 'National', 'Company'),
      description: Joi.string().allow('', null), isActive: Joi.boolean(),
    }).min(1);
    const { error } = s.validate(req.body, { abortEarly: false, stripUnknown: true }); if (error) return fail(res, error); next();
  },
};

module.exports = { leaveTypeValidator, leaveAppValidator, leaveBalanceValidator, holidayValidator };
