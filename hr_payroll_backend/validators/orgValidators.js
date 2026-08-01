const Joi = require('joi');

const makeOrgValidator = (entityName) => ({
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(),
      name: Joi.string().max(150).required(),
      nameAr: Joi.string().max(150).allow('', null),
      description: Joi.string().allow('', null),
      isActive: Joi.boolean().default(true),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      description: Joi.string().allow('', null), isActive: Joi.boolean(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  validateId: (req, res, next) => {
    const { error } = Joi.object({ id: Joi.string().uuid().required() }).validate(req.params);
    if (error) return res.status(400).json({ success: false, message: 'Invalid ID' });
    next();
  },
});

// Department-specific extra fields
const departmentValidator = {
  ...makeOrgValidator('Department'),
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(150).required(),
      nameAr: Joi.string().max(150).allow('', null),
      parentId: Joi.string().uuid().allow(null, ''),
      branchId: Joi.string().uuid().allow(null, ''),
      managerId: Joi.string().uuid().allow(null, ''),
      description: Joi.string().allow('', null),
      isActive: Joi.boolean().default(true), sortOrder: Joi.number().integer().default(0),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      parentId: Joi.string().uuid().allow(null, ''), branchId: Joi.string().uuid().allow(null, ''),
      managerId: Joi.string().uuid().allow(null, ''), description: Joi.string().allow('', null),
      isActive: Joi.boolean(), sortOrder: Joi.number().integer(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const designationValidator = {
  ...makeOrgValidator('Designation'),
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(150).required(),
      nameAr: Joi.string().max(150).allow('', null),
      departmentId: Joi.string().uuid().allow(null, ''),
      grade: Joi.string().max(20).allow('', null), description: Joi.string().allow('', null),
      isActive: Joi.boolean().default(true), sortOrder: Joi.number().integer().default(0),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      departmentId: Joi.string().uuid().allow(null, ''), grade: Joi.string().max(20).allow('', null),
      description: Joi.string().allow('', null), isActive: Joi.boolean(), sortOrder: Joi.number().integer(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const branchValidator = {
  ...makeOrgValidator('Branch'),
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(150).required(),
      nameAr: Joi.string().max(150).allow('', null),
      address: Joi.string().allow('', null), city: Joi.string().max(100).allow('', null),
      state: Joi.string().max(100).allow('', null), country: Joi.string().max(100).allow('', null),
      phone: Joi.string().max(30).allow('', null), email: Joi.string().email().max(150).allow('', null),
      isHeadOffice: Joi.boolean().default(false), isActive: Joi.boolean().default(true),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      address: Joi.string().allow('', null), city: Joi.string().max(100).allow('', null),
      state: Joi.string().max(100).allow('', null), country: Joi.string().max(100).allow('', null),
      phone: Joi.string().max(30).allow('', null), email: Joi.string().email().max(150).allow('', null),
      isHeadOffice: Joi.boolean(), isActive: Joi.boolean(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

const costCenterValidator = {
  ...makeOrgValidator('CostCenter'),
  create: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20).required(), name: Joi.string().max(150).required(),
      nameAr: Joi.string().max(150).allow('', null),
      departmentId: Joi.string().uuid().allow(null, ''),
      description: Joi.string().allow('', null), isActive: Joi.boolean().default(true),
    });
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
  update: (req, res, next) => {
    const schema = Joi.object({
      code: Joi.string().max(20), name: Joi.string().max(150), nameAr: Joi.string().max(150).allow('', null),
      departmentId: Joi.string().uuid().allow(null, ''), description: Joi.string().allow('', null), isActive: Joi.boolean(),
    }).min(1);
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Validation Error', errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })) });
    next();
  },
};

module.exports = { departmentValidator, designationValidator, branchValidator, costCenterValidator };
