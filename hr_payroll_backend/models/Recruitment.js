const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobPosition = sequelize.define('JobPosition', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  positionCode: { type: DataTypes.STRING(30), allowNull: false, field: 'position_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  departmentId: { type: DataTypes.UUID, allowNull: true, field: 'department_id' },
  designationId: { type: DataTypes.UUID, allowNull: true, field: 'designation_id' },
  vacancies: { type: DataTypes.INTEGER, defaultValue: 1 },
  minExperience: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_experience' },
  maxExperience: { type: DataTypes.INTEGER, allowNull: true, field: 'max_experience' },
  minSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'min_salary' },
  maxSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'max_salary' },
  postingDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'posting_date' },
  closingDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'closing_date' },
  status: { type: DataTypes.ENUM('Draft', 'Open', 'Closed', 'Filled', 'Cancelled'), defaultValue: 'Draft' },
  description: { type: DataTypes.TEXT, allowNull: true },
  requirements: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'job_positions', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['status'] }] });

const JobApplicant = sequelize.define('JobApplicant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  positionId: { type: DataTypes.UUID, allowNull: false, field: 'position_id' },
  applicantNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'applicant_number' },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  email: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  resumePath: { type: DataTypes.STRING(500), allowNull: true, field: 'resume_path' },
  experienceYears: { type: DataTypes.INTEGER, allowNull: true, field: 'experience_years' },
  currentCompany: { type: DataTypes.STRING(200), allowNull: true, field: 'current_company' },
  currentSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'current_salary' },
  expectedSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'expected_salary' },
  source: { type: DataTypes.ENUM('LinkedIn', 'Website', 'Referral', 'Agency', 'JobPortal', 'Other'), defaultValue: 'Website' },
  status: { type: DataTypes.ENUM('Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired', 'Rejected'), defaultValue: 'Applied' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'job_applicants', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['position_id'] }, { fields: ['status'] }] });

const Interview = sequelize.define('Interview', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  applicantId: { type: DataTypes.UUID, allowNull: false, field: 'applicant_id' },
  interviewDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'interview_date' },
  interviewTime: { type: DataTypes.TIME, allowNull: true, field: 'interview_time' },
  interviewerId: { type: DataTypes.UUID, allowNull: true, field: 'interviewer_id' },
  interviewType: { type: DataTypes.ENUM('Phone', 'Video', 'InPerson', 'Technical', 'HR'), defaultValue: 'InPerson', field: 'interview_type' },
  roundNumber: { type: DataTypes.INTEGER, defaultValue: 1, field: 'round_number' },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow'), defaultValue: 'Scheduled' },
  rating: { type: DataTypes.INTEGER, allowNull: true, comment: '1-5 rating' },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'interviews', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['applicant_id'] }, { fields: ['interview_date'] }] });

const OfferLetter = sequelize.define('OfferLetter', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  offerNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'offer_number' },
  applicantId: { type: DataTypes.UUID, allowNull: false, field: 'applicant_id' },
  positionId: { type: DataTypes.UUID, allowNull: true, field: 'position_id' },
  offerDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'offer_date' },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'joining_date' },
  offeredSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'offered_salary' },
  status: { type: DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Declined', 'Expired'), defaultValue: 'Draft' },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'expiry_date' },
  termsAndConditions: { type: DataTypes.TEXT, allowNull: true, field: 'terms_and_conditions' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'offer_letters', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['applicant_id'] }, { fields: ['status'] }] });

module.exports = { JobPosition, JobApplicant, Interview, OfferLetter };
