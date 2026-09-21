const Joi = require('joi');

const employeeValidator = {
  /**
   * Create employee validation.
   */
  create: (req, res, next) => {
    const schema = Joi.object({
      employeeCode: Joi.string().max(30).optional(),
      firstName: Joi.string().max(100).required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
      }),
      middleName: Joi.string().max(100).allow('', null),
      lastName: Joi.string().max(100).required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required',
      }),
      fullNameAr: Joi.string().max(300).allow('', null),
      gender: Joi.string().valid('Male', 'Female', 'Other').allow('', null),
      dateOfBirth: Joi.date().iso().allow(null, ''),
      placeOfBirth: Joi.string().max(150).allow('', null),
      nationality: Joi.string().max(100).allow('', null),
      religion: Joi.string().max(50).allow('', null),
      maritalStatus: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed').allow('', null),
      bloodGroup: Joi.string().max(5).allow('', null),

      personalEmail: Joi.string().email().max(150).allow('', null),
      workEmail: Joi.string().email().max(150).allow('', null),
      mobileNumber: Joi.string().max(30).allow('', null),
      workPhone: Joi.string().max(30).allow('', null),
      emergencyContactName: Joi.string().max(150).allow('', null),
      emergencyContactNumber: Joi.string().max(30).allow('', null),
      emergencyContactRelation: Joi.string().max(50).allow('', null),

      addressLine1: Joi.string().max(255).allow('', null),
      addressLine2: Joi.string().max(255).allow('', null),
      city: Joi.string().max(100).allow('', null),
      state: Joi.string().max(100).allow('', null),
      country: Joi.string().max(100).allow('', null),
      postalCode: Joi.string().max(20).allow('', null),

      passportNumber: Joi.string().max(50).allow('', null),
      passportIssueDate: Joi.date().iso().allow(null, ''),
      passportExpiryDate: Joi.date().iso().allow(null, ''),
      passportIssueCountry: Joi.string().max(100).allow('', null),

      visaNumber: Joi.string().max(50).allow('', null),
      visaType: Joi.string().max(50).allow('', null),
      visaIssueDate: Joi.date().iso().allow(null, ''),
      visaExpiryDate: Joi.date().iso().allow(null, ''),
      visaIssuePlace: Joi.string().max(100).allow('', null),

      emiratesId: Joi.string().max(50).allow('', null),
      emiratesIdExpiryDate: Joi.date().iso().allow(null, ''),

      laborCardNumber: Joi.string().max(50).allow('', null),
      laborCardExpiryDate: Joi.date().iso().allow(null, ''),

      joiningDate: Joi.date().iso().allow(null, ''),
      confirmationDate: Joi.date().iso().allow(null, ''),
      contractStartDate: Joi.date().iso().allow(null, ''),
      contractEndDate: Joi.date().iso().allow(null, ''),
      contractType: Joi.string().valid('Limited', 'Unlimited', 'Part-Time', 'Contractor', 'Intern', 'Probation').allow('', null),
      employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Intern', 'Consultant').allow('', null),
      probationEndDate: Joi.date().iso().allow(null, ''),
      status: Joi.string().valid('Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired').default('Active'),

      departmentId: Joi.string().uuid().allow(null, ''),
      designationId: Joi.string().uuid().allow(null, ''),
      branchId: Joi.string().uuid().allow(null, ''),
      costCenterId: Joi.string().uuid().allow(null, ''),
      reportingManagerId: Joi.string().uuid().allow(null, ''),

      basicSalary: Joi.number().min(0).allow(null, ''),
      housingAllowance: Joi.number().min(0).allow(null, ''),
      transportAllowance: Joi.number().min(0).allow(null, ''),
      otherAllowances: Joi.number().min(0).allow(null, ''),
      totalSalary: Joi.number().min(0).allow(null, ''),
      salaryCurrency: Joi.string().max(3).default('AED'),
      bankName: Joi.string().max(150).allow('', null),
      bankAccountNumber: Joi.string().max(50).allow('', null),
      iban: Joi.string().max(50).allow('', null),
      swiftCode: Joi.string().max(20).allow('', null),
      wpsAgentCode: Joi.string().max(50).allow('', null),

      photo: Joi.string().max(255).allow('', null),
      notes: Joi.string().allow('', null),
    });

    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }
    next();
  },

  /**
   * Update employee validation.
   */
  update: (req, res, next) => {
    const schema = Joi.object({
      employeeCode: Joi.string().max(30).optional(),
      firstName: Joi.string().max(100).optional(),
      middleName: Joi.string().max(100).allow('', null),
      lastName: Joi.string().max(100).optional(),
      fullNameAr: Joi.string().max(300).allow('', null),
      gender: Joi.string().valid('Male', 'Female', 'Other').allow('', null),
      dateOfBirth: Joi.date().iso().allow(null, ''),
      placeOfBirth: Joi.string().max(150).allow('', null),
      nationality: Joi.string().max(100).allow('', null),
      religion: Joi.string().max(50).allow('', null),
      maritalStatus: Joi.string().valid('Single', 'Married', 'Divorced', 'Widowed').allow('', null),
      bloodGroup: Joi.string().max(5).allow('', null),

      personalEmail: Joi.string().email().max(150).allow('', null),
      workEmail: Joi.string().email().max(150).allow('', null),
      mobileNumber: Joi.string().max(30).allow('', null),
      workPhone: Joi.string().max(30).allow('', null),
      emergencyContactName: Joi.string().max(150).allow('', null),
      emergencyContactNumber: Joi.string().max(30).allow('', null),
      emergencyContactRelation: Joi.string().max(50).allow('', null),

      addressLine1: Joi.string().max(255).allow('', null),
      addressLine2: Joi.string().max(255).allow('', null),
      city: Joi.string().max(100).allow('', null),
      state: Joi.string().max(100).allow('', null),
      country: Joi.string().max(100).allow('', null),
      postalCode: Joi.string().max(20).allow('', null),

      passportNumber: Joi.string().max(50).allow('', null),
      passportIssueDate: Joi.date().iso().allow(null, ''),
      passportExpiryDate: Joi.date().iso().allow(null, ''),
      passportIssueCountry: Joi.string().max(100).allow('', null),

      visaNumber: Joi.string().max(50).allow('', null),
      visaType: Joi.string().max(50).allow('', null),
      visaIssueDate: Joi.date().iso().allow(null, ''),
      visaExpiryDate: Joi.date().iso().allow(null, ''),
      visaIssuePlace: Joi.string().max(100).allow('', null),

      emiratesId: Joi.string().max(50).allow('', null),
      emiratesIdExpiryDate: Joi.date().iso().allow(null, ''),

      laborCardNumber: Joi.string().max(50).allow('', null),
      laborCardExpiryDate: Joi.date().iso().allow(null, ''),

      joiningDate: Joi.date().iso().allow(null, ''),
      confirmationDate: Joi.date().iso().allow(null, ''),
      contractStartDate: Joi.date().iso().allow(null, ''),
      contractEndDate: Joi.date().iso().allow(null, ''),
      contractType: Joi.string().valid('Limited', 'Unlimited', 'Part-Time', 'Contractor', 'Intern', 'Probation').allow('', null),
      employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Intern', 'Consultant').allow('', null),
      probationEndDate: Joi.date().iso().allow(null, ''),
      status: Joi.string().valid('Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired'),

      departmentId: Joi.string().uuid().allow(null, ''),
      designationId: Joi.string().uuid().allow(null, ''),
      branchId: Joi.string().uuid().allow(null, ''),
      costCenterId: Joi.string().uuid().allow(null, ''),
      reportingManagerId: Joi.string().uuid().allow(null, ''),

      basicSalary: Joi.number().min(0).allow(null, ''),
      housingAllowance: Joi.number().min(0).allow(null, ''),
      transportAllowance: Joi.number().min(0).allow(null, ''),
      otherAllowances: Joi.number().min(0).allow(null, ''),
      totalSalary: Joi.number().min(0).allow(null, ''),
      salaryCurrency: Joi.string().max(3),
      bankName: Joi.string().max(150).allow('', null),
      bankAccountNumber: Joi.string().max(50).allow('', null),
      iban: Joi.string().max(50).allow('', null),
      swiftCode: Joi.string().max(20).allow('', null),
      wpsAgentCode: Joi.string().max(50).allow('', null),

      photo: Joi.string().max(255).allow('', null),
      notes: Joi.string().allow('', null),

      resignationDate: Joi.date().iso().allow(null, ''),
      lastWorkingDate: Joi.date().iso().allow(null, ''),
      terminationDate: Joi.date().iso().allow(null, ''),
      terminationReason: Joi.string().allow('', null),
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update',
    });

    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }
    next();
  },

  /**
   * Validate ID parameter.
   */
  validateId: (req, res, next) => {
    const schema = Joi.object({
      id: Joi.string().uuid().required(),
    });
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }
    next();
  },
};

module.exports = employeeValidator;
