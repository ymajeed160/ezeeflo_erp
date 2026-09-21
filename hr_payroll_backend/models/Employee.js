const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Employee Model — Complete Employee Master
 * 
 * Contains personal info, employment info, salary info, passport/visa/emirates data.
 */
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },

  // ── Employee Code ──
  employeeCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'employee_code',
  },

  // ── Personal Information ──
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name',
  },
  middleName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'middle_name',
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name',
  },
  fullNameAr: {
    type: DataTypes.STRING(300),
    allowNull: true,
    field: 'full_name_ar',
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
  },
  placeOfBirth: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'place_of_birth',
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  religion: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  maritalStatus: {
    type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    allowNull: true,
    field: 'marital_status',
  },
  bloodGroup: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'blood_group',
  },

  // ── Contact Information ──
  personalEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'personal_email',
    validate: { isEmail: true },
  },
  workEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'work_email',
    validate: { isEmail: true },
  },
  mobileNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'mobile_number',
  },
  workPhone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'work_phone',
  },
  emergencyContactName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'emergency_contact_name',
  },
  emergencyContactNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'emergency_contact_number',
  },
  emergencyContactRelation: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'emergency_contact_relation',
  },

  // ── Address ──
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address_line1',
  },
  addressLine2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address_line2',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code',
  },

  // ── Passport Information ──
  passportNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'passport_number',
  },
  passportIssueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'passport_issue_date',
  },
  passportExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'passport_expiry_date',
  },
  passportIssueCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'passport_issue_country',
  },

  // ── Visa Information ──
  visaNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'visa_number',
  },
  visaType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'visa_type',
  },
  visaIssueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'visa_issue_date',
  },
  visaExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'visa_expiry_date',
  },
  visaIssuePlace: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'visa_issue_place',
  },

  // ── Emirates ID (UAE) ──
  emiratesId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'emirates_id',
  },
  emiratesIdExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'emirates_id_expiry_date',
  },

  // ── Labor Card ──
  laborCardNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'labor_card_number',
  },
  laborCardExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'labor_card_expiry_date',
  },

  // ── Employment Information ──
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'joining_date',
  },
  confirmationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'confirmation_date',
  },
  contractStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_start_date',
  },
  contractEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'contract_end_date',
  },
  contractType: {
    type: DataTypes.ENUM('Limited', 'Unlimited', 'Part-Time', 'Contractor', 'Intern', 'Probation'),
    allowNull: true,
    field: 'contract_type',
  },
  employmentType: {
    type: DataTypes.ENUM('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Intern', 'Consultant'),
    allowNull: true,
    field: 'employment_type',
  },
  probationEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'probation_end_date',
  },
  resignationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'resignation_date',
  },
  lastWorkingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_working_date',
  },
  terminationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'termination_date',
  },
  terminationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'termination_reason',
  },

  // ── Organization Links ──
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id',
  },
  designationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'designation_id',
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'branch_id',
  },
  costCenterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cost_center_id',
  },
  reportingManagerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reporting_manager_id',
  },

  // ── Salary Information ──
  basicSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'basic_salary',
  },
  housingAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'housing_allowance',
  },
  transportAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'transport_allowance',
  },
  otherAllowances: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'other_allowances',
  },
  totalSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'total_salary',
  },
  salaryCurrency: {
    type: DataTypes.STRING(3),
    defaultValue: 'AED',
    field: 'salary_currency',
  },
  bankName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'bank_name',
  },
  bankAccountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'bank_account_number',
  },
  iban: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  swiftCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'swift_code',
  },
  wpsAgentCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'wps_agent_code',
  },

  // ── Employee Status ──
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired'),
    defaultValue: 'Active',
  },

  // ── Photo ──
  photo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  // ── Notes ──
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ── Audit ──
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'employees',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['tenant_id', 'employee_code'], unique: true },
    { fields: ['department_id'] },
    { fields: ['designation_id'] },
    { fields: ['branch_id'] },
    { fields: ['cost_center_id'] },
    { fields: ['reporting_manager_id'] },
    { fields: ['status'] },
    { fields: ['joining_date'] },
    { fields: ['contract_end_date'] },
  ],
});

module.exports = Employee;
