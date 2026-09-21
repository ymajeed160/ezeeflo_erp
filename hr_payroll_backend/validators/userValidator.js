const Joi = require('joi');

const createUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(100),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    phone: Joi.string().max(30).allow('', null),
    role: Joi.string().valid('super_admin', 'company_admin', 'hr_manager', 'payroll_manager', 'hr_officer', 'recruitment_officer', 'attendance_officer', 'department_manager', 'branch_manager', 'finance_manager', 'employee', 'read_only', 'auditor', 'custom').default('employee'),
    companyIds: Joi.array().items(Joi.string().guid()).min(1),
    isActive: Joi.boolean(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation Error', errors: error.details.map(d => d.message) });
  next();
};

const updateUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(100),
    password: Joi.string().min(8).max(128),
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    phone: Joi.string().max(30).allow('', null),
    role: Joi.string().valid('super_admin', 'company_admin', 'hr_manager', 'payroll_manager', 'hr_officer', 'recruitment_officer', 'attendance_officer', 'department_manager', 'branch_manager', 'finance_manager', 'employee', 'read_only', 'auditor', 'custom'),
    companyIds: Joi.array().items(Joi.string().guid()),
    isActive: Joi.boolean(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation Error', errors: error.details.map(d => d.message) });
  next();
};

const validateId = (req, res, next) => {
  const schema = Joi.object({ id: Joi.string().guid().required() });
  const { error } = schema.validate(req.params);
  if (error) return res.status(400).json({ message: 'Invalid ID' });
  next();
};

module.exports = { createUser, updateUser, validateId };
