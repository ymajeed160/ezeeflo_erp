const { Op, fn, col, literal } = require('sequelize');
const {
  SalaryStructure, SalaryComponent, EmployeeSalary,
  AllowanceType, EmployeeAllowance, DeductionType, EmployeeDeduction,
  EmployeeLoan, LoanRepayment,
  PayrollPeriod, PayrollRun, PayrollDetail, Payslip,
  Employee, Department, Designation,
} = require('../models');

// ── Generic CRUD Repo Factory ──
const makeRepo = (Model, searchFields = ['code', 'name']) => ({
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, search = '' } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (search) where[Op.or] = searchFields.map(f => ({ [f]: { [Op.like]: `%${search}%` } }));
    const { count, rows } = await Model.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
  findById: async (id, tenantId) => Model.findOne({ where: { id, tenantId } }),
  create: async (data) => Model.create(data),
  update: async (id, tenantId, data) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.update(data); },
  delete: async (id, tenantId) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.destroy(); },
});

// ── Repos ──
const salaryStructureRepo = makeRepo(SalaryStructure);
const allowanceTypeRepo = makeRepo(AllowanceType);
const deductionTypeRepo = makeRepo(DeductionType);

// SalaryComponent
const salaryComponentRepo = {
  ...makeRepo(SalaryComponent),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 50, structureId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (structureId) where.structureId = structureId;
    const { count, rows } = await SalaryComponent.findAndCountAll({ where, include: [{ model: SalaryStructure, as: 'structure', attributes: ['id', 'code', 'name'], required: false }], order: [['sortOrder']], offset, limit: parseInt(limit), distinct: true });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

// EmployeeSalary
const employeeSalaryRepo = {
  ...makeRepo(EmployeeSalary, []),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, employeeId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    const { count, rows } = await EmployeeSalary.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
        { model: SalaryStructure, as: 'structure', attributes: ['id', 'code', 'name'], required: false },
      ],
      order: [['effectiveFrom', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

// Employee allowances & deductions
const empAllowanceRepo = {
  ...makeRepo(EmployeeAllowance, []),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 20, employeeId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    const { count, rows } = await EmployeeAllowance.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
        { model: AllowanceType, as: 'allowanceType', attributes: ['id', 'code', 'name', 'allowanceCategory'], required: false },
      ],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

const empDeductionRepo = {
  ...makeRepo(EmployeeDeduction, []),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 20, employeeId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    const { count, rows } = await EmployeeDeduction.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
        { model: DeductionType, as: 'deductionType', attributes: ['id', 'code', 'name', 'deductionCategory'], required: false },
      ],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

// Employee Loans
const employeeLoanRepo = {
  ...makeRepo(EmployeeLoan, ['loanNumber']),
  findById: async (id, tenantId) => EmployeeLoan.findOne({ where: { id, tenantId }, include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'] }] }),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, employeeId, status } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    const { count, rows } = await EmployeeLoan.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

// Loan Repayment
const loanRepaymentRepo = makeRepo(LoanRepayment, []);

// Payroll Period
const payrollPeriodRepo = makeRepo(PayrollPeriod, ['periodCode', 'periodName']);

// Payroll Run
const payrollRunRepo = {
  ...makeRepo(PayrollRun, ['runNumber']),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, status, periodId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (status) where.status = status;
    if (periodId) where.periodId = periodId;
    const { count, rows } = await PayrollRun.findAndCountAll({
      where,
      include: [{ model: PayrollPeriod, as: 'period', attributes: ['id', 'periodCode', 'periodName', 'startDate', 'endDate', 'frequency'], required: false }],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
  getNextRunNumber: async (tenantId) => {
    const last = await PayrollRun.findOne({ where: { tenantId }, order: [['createdAt', 'DESC']], paranoid: false });
    if (!last?.runNumber) return 'PR-000001';
    const match = last.runNumber.match(/PR-(\d+)/);
    return match ? `PR-${String(parseInt(match[1]) + 1).padStart(6, '0')}` : 'PR-000001';
  },
};

// Payroll Detail
const payrollDetailRepo = {
  ...makeRepo(PayrollDetail, []),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 20, payrollRunId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (payrollRunId) where.payrollRunId = payrollRunId;
    const { count, rows } = await PayrollDetail.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }],
      order: [['netPay', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

// Payslip
const payslipRepo = {
  ...makeRepo(Payslip, ['payslipNumber']),
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, employeeId, payrollRunId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (payrollRunId) where.payrollRunId = payrollRunId;
    const { count, rows } = await Payslip.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false },
        { model: PayrollRun, as: 'payrollRun', attributes: ['id', 'runNumber', 'runDate'], required: false },
      ],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
};

module.exports = {
  salaryStructureRepo, salaryComponentRepo, employeeSalaryRepo,
  allowanceTypeRepo, empAllowanceRepo, deductionTypeRepo, empDeductionRepo,
  employeeLoanRepo, loanRepaymentRepo,
  payrollPeriodRepo, payrollRunRepo, payrollDetailRepo, payslipRepo,
};
