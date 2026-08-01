const Joi = require('joi');

const validateId = (req, res, next) => {
  const { error } = Joi.object({ id: Joi.string().uuid().required() }).validate(req.params);
  if (error) return res.status(400).json({ success: false, message: 'Invalid ID' });
  next();
};

const shiftValidator = {
  validateId,
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(100).required(),
      shiftType: Joi.string().valid('Morning', 'Evening', 'Night', 'Rotational', 'Flexible').required(),
      startTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).required(),
      endTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).required(),
      gracePeriodMinutes: Joi.number().integer().min(0).default(15),
      lateThresholdMinutes: Joi.number().integer().min(0).default(30),
      halfDayThresholdMinutes: Joi.number().integer().min(0).default(240),
      earlyLeavingThresholdMinutes: Joi.number().integer().min(0).default(15),
      breakStartTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
      breakEndTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
      totalWorkingHours: Joi.number().min(0).max(24).allow(null),
      weeklyOffDays: Joi.string().max(50).allow('', null),
      isNightShift: Joi.boolean().default(false), color: Joi.string().max(7).allow('', null),
      description: Joi.string().allow('', null), isActive: Joi.boolean().default(true),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(100),
      shiftType: Joi.string().valid('Morning', 'Evening', 'Night', 'Rotational', 'Flexible'),
      startTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      endTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      gracePeriodMinutes: Joi.number().integer().min(0), lateThresholdMinutes: Joi.number().integer().min(0),
      halfDayThresholdMinutes: Joi.number().integer().min(0), earlyLeavingThresholdMinutes: Joi.number().integer().min(0),
      breakStartTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
      breakEndTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
      totalWorkingHours: Joi.number().min(0).max(24).allow(null),
      weeklyOffDays: Joi.string().max(50).allow('', null), isNightShift: Joi.boolean(), color: Joi.string().max(7).allow('', null),
      description: Joi.string().allow('', null), isActive: Joi.boolean(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const attendanceValidator = {
  validateId,
  markAttendance: (req, res, next) => {
    const schema = Joi.object({
      employeeId: Joi.string().uuid().required(),
      attendanceDate: Joi.date().iso().required(),
      checkInTime: Joi.date().iso().allow(null),
      checkOutTime: Joi.date().iso().allow(null),
      method: Joi.string().valid('Manual', 'Biometric', 'GPS', 'Mobile', 'Face', 'Web').default('Manual'),
      remarks: Joi.string().allow('', null),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      checkInTime: Joi.date().iso().allow(null), checkOutTime: Joi.date().iso().allow(null),
      status: Joi.string().valid('Present', 'Absent', 'Late', 'Half Day', 'Weekly Off', 'Holiday', 'On Leave'),
      lateMinutes: Joi.number().integer().min(0), totalWorkedMinutes: Joi.number().integer().min(0),
      overtimeMinutes: Joi.number().integer().min(0), remarks: Joi.string().allow('', null),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const saValidator = {
  validateId,
  create: (req, res, next) => {
    const schema = Joi.object({
      employeeId: Joi.string().uuid().required(), shiftId: Joi.string().uuid().required(),
      effectiveFrom: Joi.date().iso().required(), effectiveTo: Joi.date().iso().allow(null),
      notes: Joi.string().allow('', null),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      effectiveFrom: Joi.date().iso(), effectiveTo: Joi.date().iso().allow(null),
      isActive: Joi.boolean(), notes: Joi.string().allow('', null),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const rosterValidator = {
  validateId,
  create: (req, res, next) => {
    const schema = Joi.object({
      employeeId: Joi.string().uuid().required(), shiftId: Joi.string().uuid().required(),
      rosterDate: Joi.date().iso().required(),
      isWeeklyOff: Joi.boolean().default(false), isHoliday: Joi.boolean().default(false),
      notes: Joi.string().allow('', null),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  generate: (req, res, next) => {
    const schema = Joi.object({
      dateFrom: Joi.date().iso().required(), dateTo: Joi.date().iso().required(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const overtimeValidator = {
  validateId,
  create: (req, res, next) => {
    const schema = Joi.object({
      employeeId: Joi.string().uuid().required(), overtimeDate: Joi.date().iso().required(),
      startTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).required(),
      endTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).required(),
      overtimeType: Joi.string().valid('Regular', 'Weekend', 'Holiday').default('Regular'),
      rateMultiplier: Joi.number().min(1).max(3).default(1.25),
      reason: Joi.string().allow('', null), attendanceId: Joi.string().uuid().allow(null, ''),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      startTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), endTime: Joi.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      overtimeType: Joi.string().valid('Regular', 'Weekend', 'Holiday'),
      rateMultiplier: Joi.number().min(1).max(3), reason: Joi.string().allow('', null),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

module.exports = { shiftValidator, attendanceValidator, saValidator, rosterValidator, overtimeValidator };
