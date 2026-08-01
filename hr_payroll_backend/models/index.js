const sequelize = require('../config/database');
const { Sequelize, DataTypes } = require('sequelize');

// ── Organization ──
const Department = require('./Department');
const Designation = require('./Designation');
const Branch = require('./Branch');
const CostCenter = require('./CostCenter');

// ── Employee ──
const Employee = require('./Employee');
const EmployeeDocument = require('./EmployeeDocument');

// ── Attendance & Shift ──
const Shift = require('./Shift');
const ShiftAssignment = require('./ShiftAssignment');
const Roster = require('./Roster');
const Attendance = require('./Attendance');
const OvertimeEntry = require('./OvertimeEntry');

// ── Leave & Holidays ──
const LeaveType = require('./LeaveType');
const LeaveBalance = require('./LeaveBalance');
const LeaveApplication = require('./LeaveApplication');
const LeaveApproval = require('./LeaveApproval');
const Holiday = require('./Holiday');

// ── Payroll & Salary ──
const SalaryStructure = require('./SalaryStructure');
const SalaryComponent = require('./SalaryComponent');
const EmployeeSalary = require('./EmployeeSalary');
const AllowanceType = require('./AllowanceType');
const EmployeeAllowance = require('./EmployeeAllowance');
const DeductionType = require('./DeductionType');
const EmployeeDeduction = require('./EmployeeDeduction');
const EmployeeLoan = require('./EmployeeLoan');
const LoanRepayment = require('./LoanRepayment');
const PayrollPeriod = require('./PayrollPeriod');
const PayrollRun = require('./PayrollRun');
const PayrollDetail = require('./PayrollDetail');
const Payslip = require('./Payslip');

// ── Benefits, EOSB, WPS, ESS ──
const { BenefitType, EmployeeBenefit } = require('./Benefit');
const { EosbCalculation, EosbSettlement } = require('./Eosb');
const { WpsConfiguration, WpsExport } = require('./Wps');
const EssSubmission = require('./EssSubmission');

// ── Performance, Training, Recruitment, OnOffboarding ──
const { PerformanceGoal, PerformanceKpi, PerformanceAppraisal } = require('./Performance');
const { TrainingCourse, TrainingSession, TrainingAttendee } = require('./Training');
const { JobPosition, JobApplicant, Interview, OfferLetter } = require('./Recruitment');
const { OnboardingChecklist, OnboardingProgress, OffboardingChecklist, OffboardingProgress, ExitInterview } = require('./OnOffboarding');

// ── Security & RBAC ──
const User = require('./User');
const UserCompany = require('./UserCompany');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const UserRole = require('./UserRole');

// ── Settings ──
const { GeneralSetting, CompanyProfile, LocalizationSetting, WorkingHourSetting, SettingsAuditLog } = require('./Settings');

// ── Master Data ──
const { MasterCountry, MasterState, MasterData, MasterDataAudit } = require('./MasterData');

// ═══════════════════════════════════════════
// SECURITY ASSOCIATIONS
// ═══════════════════════════════════════════
User.hasMany(UserCompany, { as: 'companies', foreignKey: 'user_id' });
UserCompany.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// User ↔ Role (many-to-many through UserRole)
User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'role_id' });
UserRole.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
UserRole.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });

// Role ↔ Permission (many-to-many through RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions', foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, as: 'roles', foreignKey: 'permission_id' });
RolePermission.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });
RolePermission.belongsTo(Permission, { as: 'permission', foreignKey: 'permission_id' });

// ═══════════════════════════════════════════
// ASSOCIATIONS
// ═══════════════════════════════════════════

// Department self-reference (parent-child hierarchy)
Department.belongsTo(Department, { as: 'parent', foreignKey: 'parent_id' });
Department.hasMany(Department, { as: 'children', foreignKey: 'parent_id' });
Department.belongsTo(Branch, { as: 'branch', foreignKey: 'branch_id' });
Department.belongsTo(Employee, { as: 'manager', foreignKey: 'manager_id' });

// Designation
Designation.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });

// Branch
Branch.hasMany(Department, { as: 'departments', foreignKey: 'branch_id' });

// CostCenter
CostCenter.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });

// Employee — Department association
Employee.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });
Department.hasMany(Employee, { as: 'employees', foreignKey: 'department_id' });

// Employee — Designation association
Employee.belongsTo(Designation, { as: 'designation', foreignKey: 'designation_id' });
Designation.hasMany(Employee, { as: 'employees', foreignKey: 'designation_id' });

// Employee — Branch association
Employee.belongsTo(Branch, { as: 'branch', foreignKey: 'branch_id' });
Branch.hasMany(Employee, { as: 'employees', foreignKey: 'branch_id' });

// Employee — CostCenter association
Employee.belongsTo(CostCenter, { as: 'costCenter', foreignKey: 'cost_center_id' });
CostCenter.hasMany(Employee, { as: 'employees', foreignKey: 'cost_center_id' });

// Employee — Reporting Manager (self-reference)
Employee.belongsTo(Employee, { as: 'reportingManager', foreignKey: 'reporting_manager_id' });
Employee.hasMany(Employee, { as: 'subordinates', foreignKey: 'reporting_manager_id' });

// Employee — Documents
Employee.hasMany(EmployeeDocument, { as: 'documents', foreignKey: 'employee_id' });
EmployeeDocument.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// ── Attendance & Shift Associations ──

// Shift
Shift.hasMany(ShiftAssignment, { as: 'assignments', foreignKey: 'shift_id' });
ShiftAssignment.belongsTo(Shift, { as: 'shift', foreignKey: 'shift_id' });

Shift.hasMany(Roster, { as: 'rosters', foreignKey: 'shift_id' });
Roster.belongsTo(Shift, { as: 'shift', foreignKey: 'shift_id' });

Shift.hasMany(Attendance, { as: 'attendances', foreignKey: 'shift_id' });
Attendance.belongsTo(Shift, { as: 'shift', foreignKey: 'shift_id' });

// ShiftAssignment — Employee
ShiftAssignment.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(ShiftAssignment, { as: 'shiftAssignments', foreignKey: 'employee_id' });

// Roster — Employee
Roster.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(Roster, { as: 'rosters', foreignKey: 'employee_id' });

// Attendance — Employee
Attendance.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(Attendance, { as: 'attendances', foreignKey: 'employee_id' });

// OvertimeEntry — Employee
OvertimeEntry.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(OvertimeEntry, { as: 'overtimeEntries', foreignKey: 'employee_id' });

// OvertimeEntry — Attendance
OvertimeEntry.belongsTo(Attendance, { as: 'attendance', foreignKey: 'attendance_id' });
Attendance.hasMany(OvertimeEntry, { as: 'overtimeEntries', foreignKey: 'attendance_id' });

// ── Leave & Holidays Associations ──

// LeaveType
LeaveType.hasMany(LeaveBalance, { as: 'balances', foreignKey: 'leave_type_id' });
LeaveBalance.belongsTo(LeaveType, { as: 'leaveType', foreignKey: 'leave_type_id' });

LeaveType.hasMany(LeaveApplication, { as: 'applications', foreignKey: 'leave_type_id' });
LeaveApplication.belongsTo(LeaveType, { as: 'leaveType', foreignKey: 'leave_type_id' });

// LeaveBalance — Employee
LeaveBalance.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(LeaveBalance, { as: 'leaveBalances', foreignKey: 'employee_id' });

// LeaveApplication — Employee
LeaveApplication.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(LeaveApplication, { as: 'leaveApplications', foreignKey: 'employee_id' });

// LeaveApproval — LeaveApplication
LeaveApproval.belongsTo(LeaveApplication, { as: 'leaveApplication', foreignKey: 'leave_application_id' });
LeaveApplication.hasMany(LeaveApproval, { as: 'approvals', foreignKey: 'leave_application_id' });

// LeaveApproval — Employee (approver)
LeaveApproval.belongsTo(Employee, { as: 'approver', foreignKey: 'approver_id' });

// ── Payroll & Salary Associations ──

// SalaryStructure — SalaryComponent
SalaryStructure.hasMany(SalaryComponent, { as: 'components', foreignKey: 'structure_id' });
SalaryComponent.belongsTo(SalaryStructure, { as: 'structure', foreignKey: 'structure_id' });

// EmployeeSalary
EmployeeSalary.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(EmployeeSalary, { as: 'salaries', foreignKey: 'employee_id' });
EmployeeSalary.belongsTo(SalaryStructure, { as: 'structure', foreignKey: 'structure_id' });

// AllowanceType — EmployeeAllowance
AllowanceType.hasMany(EmployeeAllowance, { as: 'employeeAllowances', foreignKey: 'allowance_type_id' });
EmployeeAllowance.belongsTo(AllowanceType, { as: 'allowanceType', foreignKey: 'allowance_type_id' });
EmployeeAllowance.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// DeductionType — EmployeeDeduction
DeductionType.hasMany(EmployeeDeduction, { as: 'employeeDeductions', foreignKey: 'deduction_type_id' });
EmployeeDeduction.belongsTo(DeductionType, { as: 'deductionType', foreignKey: 'deduction_type_id' });
EmployeeDeduction.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
EmployeeDeduction.belongsTo(EmployeeLoan, { as: 'loan', foreignKey: 'loan_id' });

// EmployeeLoan
EmployeeLoan.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(EmployeeLoan, { as: 'loans', foreignKey: 'employee_id' });

// LoanRepayment
LoanRepayment.belongsTo(EmployeeLoan, { as: 'loan', foreignKey: 'loan_id' });
EmployeeLoan.hasMany(LoanRepayment, { as: 'repayments', foreignKey: 'loan_id' });
LoanRepayment.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
LoanRepayment.belongsTo(PayrollRun, { as: 'payrollRun', foreignKey: 'payroll_run_id' });

// Payroll Period
PayrollPeriod.hasMany(PayrollRun, { as: 'runs', foreignKey: 'period_id' });

// PayrollRun
PayrollRun.belongsTo(PayrollPeriod, { as: 'period', foreignKey: 'period_id' });
PayrollRun.hasMany(PayrollDetail, { as: 'details', foreignKey: 'payroll_run_id' });
PayrollRun.hasMany(Payslip, { as: 'payslips', foreignKey: 'payroll_run_id' });

// PayrollDetail
PayrollDetail.belongsTo(PayrollRun, { as: 'payrollRun', foreignKey: 'payroll_run_id' });
PayrollDetail.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// Payslip
Payslip.belongsTo(PayrollRun, { as: 'payrollRun', foreignKey: 'payroll_run_id' });
Payslip.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// ── Benefits, EOSB, WPS, ESS Associations ──

// BenefitType
BenefitType.hasMany(EmployeeBenefit, { as: 'employeeBenefits', foreignKey: 'benefit_type_id' });
EmployeeBenefit.belongsTo(BenefitType, { as: 'benefitType', foreignKey: 'benefit_type_id' });
EmployeeBenefit.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// EOSB
EosbCalculation.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(EosbCalculation, { as: 'eosbCalculations', foreignKey: 'employee_id' });
EosbSettlement.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
EosbSettlement.belongsTo(EosbCalculation, { as: 'calculation', foreignKey: 'calculation_id' });

// WPS
WpsConfiguration.hasMany(WpsExport, { as: 'exports', foreignKey: 'config_id' });
WpsExport.belongsTo(WpsConfiguration, { as: 'config', foreignKey: 'config_id' });
WpsExport.belongsTo(PayrollRun, { as: 'payrollRun', foreignKey: 'payroll_run_id' });

// ESS
EssSubmission.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(EssSubmission, { as: 'essSubmissions', foreignKey: 'employee_id' });

// ── Performance ──
PerformanceGoal.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(PerformanceGoal, { as: 'performanceGoals', foreignKey: 'employee_id' });
PerformanceAppraisal.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
PerformanceAppraisal.belongsTo(Employee, { as: 'appraiser', foreignKey: 'appraiser_id' });
Employee.hasMany(PerformanceAppraisal, { as: 'appraisals', foreignKey: 'employee_id' });

// ── Training ──
TrainingSession.belongsTo(TrainingCourse, { as: 'course', foreignKey: 'course_id' });
TrainingCourse.hasMany(TrainingSession, { as: 'sessions', foreignKey: 'course_id' });
TrainingAttendee.belongsTo(TrainingSession, { as: 'session', foreignKey: 'session_id' });
TrainingSession.hasMany(TrainingAttendee, { as: 'attendees', foreignKey: 'session_id' });
TrainingAttendee.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });

// ── Recruitment ──
JobPosition.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });
JobPosition.belongsTo(Designation, { as: 'designation', foreignKey: 'designation_id' });
JobApplicant.belongsTo(JobPosition, { as: 'position', foreignKey: 'position_id' });
JobPosition.hasMany(JobApplicant, { as: 'applicants', foreignKey: 'position_id' });
Interview.belongsTo(JobApplicant, { as: 'applicant', foreignKey: 'applicant_id' });
JobApplicant.hasMany(Interview, { as: 'interviews', foreignKey: 'applicant_id' });
Interview.belongsTo(Employee, { as: 'interviewer', foreignKey: 'interviewer_id' });
OfferLetter.belongsTo(JobApplicant, { as: 'applicant', foreignKey: 'applicant_id' });
OfferLetter.belongsTo(JobPosition, { as: 'position', foreignKey: 'position_id' });

// ── Onboarding / Offboarding ──
OnboardingProgress.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
OnboardingProgress.belongsTo(OnboardingChecklist, { as: 'checklist', foreignKey: 'checklist_id' });
Employee.hasMany(OnboardingProgress, { as: 'onboardingProgress', foreignKey: 'employee_id' });

OffboardingProgress.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
OffboardingProgress.belongsTo(OffboardingChecklist, { as: 'checklist', foreignKey: 'checklist_id' });
Employee.hasMany(OffboardingProgress, { as: 'offboardingProgress', foreignKey: 'employee_id' });

ExitInterview.belongsTo(Employee, { as: 'employee', foreignKey: 'employee_id' });
Employee.hasMany(ExitInterview, { as: 'exitInterviews', foreignKey: 'employee_id' });

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

const db = {
  sequelize,
  Sequelize,
  DataTypes,

  // Organization
  Department,
  Designation,
  Branch,
  CostCenter,

  // Employee
  Employee,
  EmployeeDocument,

  // Attendance & Shift
  Shift,
  ShiftAssignment,
  Roster,
  Attendance,
  OvertimeEntry,

  // Leave & Holidays
  LeaveType,
  LeaveBalance,
  LeaveApplication,
  LeaveApproval,
  Holiday,

  // Payroll & Salary
  SalaryStructure,
  SalaryComponent,
  EmployeeSalary,
  AllowanceType,
  EmployeeAllowance,
  DeductionType,
  EmployeeDeduction,
  EmployeeLoan,
  LoanRepayment,
  PayrollPeriod,
  PayrollRun,
  PayrollDetail,
  Payslip,

  // Benefits, EOSB, WPS, ESS
  BenefitType,
  EmployeeBenefit,
  EosbCalculation,
  EosbSettlement,
  WpsConfiguration,
  WpsExport,
  EssSubmission,

  // Performance, Training, Recruitment, OnOffboarding
  PerformanceGoal, PerformanceKpi, PerformanceAppraisal,
  TrainingCourse, TrainingSession, TrainingAttendee,
  JobPosition, JobApplicant, Interview, OfferLetter,
  OnboardingChecklist, OnboardingProgress,
  OffboardingChecklist, OffboardingProgress, ExitInterview,
  // Settings
  GeneralSetting, CompanyProfile, LocalizationSetting, WorkingHourSetting, SettingsAuditLog,
  // Master Data
  User, UserCompany, Role, Permission, RolePermission, UserRole,
  MasterCountry, MasterData, MasterDataAudit,
};

module.exports = db;
