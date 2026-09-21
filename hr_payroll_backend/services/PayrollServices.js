const {
  salaryStructureRepo, salaryComponentRepo, employeeSalaryRepo,
  allowanceTypeRepo, empAllowanceRepo, deductionTypeRepo, empDeductionRepo,
  employeeLoanRepo, loanRepaymentRepo,
  payrollPeriodRepo, payrollRunRepo, payrollDetailRepo, payslipRepo,
} = require('../repositories/PayrollRepositories');
const { Employee, EmployeeAllowance, EmployeeDeduction, EmployeeLoan, LoanRepayment, PayrollRun, PayrollDetail, Payslip, EmployeeSalary, AllowanceType, DeductionType } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/appError');
const { Op } = require('sequelize');

// ── DTO helpers ──
const plainDTO = (r) => r ? { ...r.dataValues || r, createdAt: r.createdAt, updatedAt: r.updatedAt } : null;

const toES = (e) => e ? { id: e.id, employeeId: e.employeeId, structureId: e.structureId, effectiveFrom: e.effectiveFrom, effectiveTo: e.effectiveTo, basicSalary: parseFloat(e.basicSalary), grossSalary: parseFloat(e.grossSalary), netSalary: parseFloat(e.netSalary), currency: e.currency, paymentMode: e.paymentMode, bankName: e.bankName, bankAccountNumber: e.bankAccountNumber, iban: e.iban, isActive: e.isActive, employee: e.employee ? { id: e.employee.id, code: e.employee.employeeCode, name: `${e.employee.firstName} ${e.employee.lastName}` } : null, structure: e.structure ? { id: e.structure.id, code: e.structure.code, name: e.structure.name } : null } : null;

const toPR = (r) => r ? { id: r.id, runNumber: r.runNumber, periodId: r.periodId, runDate: r.runDate, totalEmployees: r.totalEmployees, totalGross: parseFloat(r.totalGross), totalDeductions: parseFloat(r.totalDeductions), totalNetPay: parseFloat(r.totalNetPay), totalEmployerContributions: parseFloat(r.totalEmployerContributions), status: r.status, approvedBy: r.approvedBy, approvedAt: r.approvedAt, notes: r.notes, period: r.period ? { id: r.period.id, periodCode: r.period.periodCode, periodName: r.period.periodName, startDate: r.period.startDate, endDate: r.period.endDate, frequency: r.period.frequency } : null, createdAt: r.createdAt, updatedAt: r.updatedAt } : null;

const toPD = (d) => d ? { id: d.id, payrollRunId: d.payrollRunId, employeeId: d.employeeId, basicSalary: parseFloat(d.basicSalary), allowances: parseFloat(d.allowances), deductions: parseFloat(d.deductions), overtimePay: parseFloat(d.overtimePay), loanDeduction: parseFloat(d.loanDeduction), grossPay: parseFloat(d.grossPay), netPay: parseFloat(d.netPay), employerContributions: parseFloat(d.employerContributions), workingDays: d.workingDays, paidDays: d.paidDays, absentDays: d.absentDays, overtimeHours: parseFloat(d.overtimeHours), notes: d.notes, employee: d.employee ? { id: d.employee.id, code: d.employee.employeeCode, name: `${d.employee.firstName} ${d.employee.lastName}` } : null, createdAt: d.createdAt, updatedAt: d.updatedAt } : null;

// ── Services ──
const makeService = (repo, dto = plainDTO) => ({
  getAll: async (tenantId, query) => { const r = await repo.findAll({ tenantId, query }); r.data = r.data.map(dto); return r; },
  getById: async (id, tenantId) => { const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Record not found'); return dto(d); },
  create: async (data, tenantId, userId) => dto(await repo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId })),
  update: async (id, data, tenantId, userId) => { const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Record not found'); await repo.update(id, tenantId, { ...data, updatedBy: userId }); return dto(await repo.findById(id, tenantId)); },
  delete: async (id, tenantId) => { const d = await repo.findById(id, tenantId); if (!d) throw new NotFoundError('Record not found'); await repo.delete(id, tenantId); return { success: true }; },
});

const salaryStructureSvc = makeService(salaryStructureRepo);
const salaryComponentSvc = makeService(salaryComponentRepo);
const allowanceTypeSvc = makeService(allowanceTypeRepo);
const deductionTypeSvc = makeService(deductionTypeRepo);
const payrollPeriodSvc = makeService(payrollPeriodRepo);
const payrollRunSvc = { ...makeService(payrollRunRepo, toPR) };

// Employee Salary
const employeeSalarySvc = {
  ...makeService(employeeSalaryRepo, toES),
  create: async (data, tenantId, userId) => {
    const totalAllowances = await EmployeeAllowance.sum('amount', { where: { employeeId: data.employeeId, tenantId, isActive: true } }) || 0;
    const totalDeductions = await EmployeeDeduction.sum('amount', { where: { employeeId: data.employeeId, tenantId, isActive: true } }) || 0;
    const gross = parseFloat(data.basicSalary || 0) + parseFloat(totalAllowances);
    const net = gross - parseFloat(totalDeductions);
    return toES(await employeeSalaryRepo.create({ ...data, grossSalary: gross, netSalary: net, tenantId, createdBy: userId, updatedBy: userId }));
  },
  update: async (id, data, tenantId, userId) => {
    const existing = await employeeSalaryRepo.findById(id, tenantId);
    if (!existing) throw new NotFoundError('Salary record not found');
    const empId = data.employeeId || existing.employeeId;
    const basic = parseFloat(data.basicSalary ?? existing.basicSalary);
    const totalAllowances = await EmployeeAllowance.sum('amount', { where: { employeeId: empId, tenantId, isActive: true } }) || 0;
    const totalDeductions = await EmployeeDeduction.sum('amount', { where: { employeeId: empId, tenantId, isActive: true } }) || 0;
    const gross = basic + parseFloat(totalAllowances);
    const net = gross - parseFloat(totalDeductions);
    await employeeSalaryRepo.update(id, tenantId, { ...data, grossSalary: gross, netSalary: net, updatedBy: userId });
    return toES(await employeeSalaryRepo.findById(id, tenantId));
  },
};

// Employee Allowance
const empAllowanceSvc = makeService(empAllowanceRepo);

// Employee Deduction
const empDeductionSvc = {
  ...makeService(empDeductionRepo),
  create: async (data, tenantId, userId) => {
    const deduction = await empDeductionRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    // If linked to a loan, auto-update loan payments
    if (data.loanId) {
      const loan = await employeeLoanRepo.findById(data.loanId, tenantId);
      if (loan && loan.status === 'Active') {
        const newPaid = (loan.paidInstallments || 0) + 1;
        const remaining = parseFloat(loan.principalAmount) - (newPaid * parseFloat(loan.monthlyInstallment));
        const newStatus = newPaid >= loan.totalInstallments ? 'Closed' : 'Active';
        await loan.update({
          paidInstallments: newPaid,
          remainingAmount: Math.max(0, remaining),
          status: newStatus,
          updatedBy: userId,
        });
      }
    }
    return plainDTO(deduction);
  },
  delete: async (id, tenantId) => {
    const deduction = await empDeductionRepo.findById(id, tenantId);
    if (!deduction) throw new NotFoundError('Deduction not found');
    // If linked to a loan, reverse the payment
    if (deduction.loanId) {
      const loan = await employeeLoanRepo.findById(deduction.loanId, tenantId);
      if (loan) {
        const newPaid = Math.max(0, (loan.paidInstallments || 0) - 1);
        const remaining = parseFloat(loan.principalAmount) - (newPaid * parseFloat(loan.monthlyInstallment));
        const newStatus = loan.status === 'Closed' ? 'Active' : loan.status;
        await loan.update({
          paidInstallments: newPaid,
          remainingAmount: remaining,
          status: newStatus,
        });
      }
    }
    await empDeductionRepo.delete(id, tenantId);
    return { success: true };
  },
};

// Employee Loan
const employeeLoanSvc = {
  ...makeService(employeeLoanRepo),
  create: async (data, tenantId, userId) => {
    // Auto-generate loan number
    data.loanNumber = `LN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    // Calculate remaining
    data.remainingAmount = parseFloat(data.principalAmount);
    const loan = await employeeLoanRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    // Generate repayment schedule
    const installments = [];
    for (let i = 1; i <= data.totalInstallments; i++) {
      const dueDate = new Date(data.startDate);
      dueDate.setMonth(dueDate.getMonth() + i - 1);
      installments.push({
        loanId: loan.id, employeeId: data.employeeId, installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: data.monthlyInstallment,
        principalPortion: data.monthlyInstallment,
        interestPortion: 0,
        tenantId, createdBy: userId, updatedBy: userId,
      });
    }
    await LoanRepayment.bulkCreate(installments);
    return plainDTO(loan);
  },
  approve: async (id, tenantId, userId) => {
    const loan = await employeeLoanRepo.findById(id, tenantId);
    if (!loan) throw new NotFoundError('Loan not found');
    if (loan.status !== 'Pending') throw new BadRequestError('Only pending loans can be approved');
    await loan.update({ status: 'Approved', approvedBy: userId, updatedBy: userId });
    return plainDTO(await employeeLoanRepo.findById(id, tenantId));
  },
  reject: async (id, tenantId, userId) => {
    const loan = await employeeLoanRepo.findById(id, tenantId);
    if (!loan) throw new NotFoundError('Loan not found');
    if (loan.status !== 'Pending') throw new BadRequestError('Only pending loans can be rejected');
    await loan.update({ status: 'Rejected', updatedBy: userId });
    return plainDTO(await employeeLoanRepo.findById(id, tenantId));
  },
  activate: async (id, tenantId, userId) => {
    const loan = await employeeLoanRepo.findById(id, tenantId);
    if (!loan) throw new NotFoundError('Loan not found');
    if (loan.status !== 'Approved') throw new BadRequestError('Only approved loans can be activated');
    await loan.update({ status: 'Active', updatedBy: userId });
    return plainDTO(await employeeLoanRepo.findById(id, tenantId));
  },
  update: async (id, data, tenantId, userId) => {
    const loan = await employeeLoanRepo.findById(id, tenantId);
    if (!loan) throw new NotFoundError('Loan not found');
    // Recalculate remaining: principal - (paid * monthly)
    const principal = parseFloat(data.principalAmount || loan.principalAmount);
    const monthly = parseFloat(data.monthlyInstallment || loan.monthlyInstallment);
    const paid = parseInt(data.paidInstallments ?? loan.paidInstallments, 10);
    data.remainingAmount = principal - (paid * monthly);
    await employeeLoanRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return plainDTO(await employeeLoanRepo.findById(id, tenantId));
  },
};

// Loan Repayment
const loanRepaymentSvc = makeService(loanRepaymentRepo);

// ═══════════════════════════════
// PAYROLL PROCESSING ENGINE
// ═══════════════════════════════

const payrollDetailSvc = {
  ...makeService(payrollDetailRepo, toPD),
};

const payslipSvc = {
  ...makeService(payslipRepo),
};

const processPayroll = async (periodId, tenantId, userId) => {
  // Validate period
  const period = await payrollPeriodRepo.findById(periodId, tenantId);
  if (!period) throw new NotFoundError('Payroll period not found');
  if (period.status === 'Locked') throw new BadRequestError('Period is locked');

  // Create payroll run
  const runNumber = await payrollRunRepo.getNextRunNumber(tenantId);
  const run = await PayrollRun.create({
    tenantId, runNumber, periodId, runDate: new Date().toISOString().split('T')[0],
    status: 'Draft', createdBy: userId, updatedBy: userId,
  });

  // Get all active employees with active salaries
  const activeSalaries = await EmployeeSalary.findAll({
    where: { tenantId, isActive: true, effectiveFrom: { [Op.lte]: period.endDate }, [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: period.startDate } }] },
    include: [{ model: Employee, as: 'employee', where: { status: 'Active' }, required: true }],
  });

  let totalGross = 0, totalDeductions = 0, totalNet = 0, totalEmployer = 0;
  const details = [];

  for (const sal of activeSalaries) {
    const empId = sal.employeeId;

    // Calculate allowances with names
    const empAllowances = await EmployeeAllowance.findAll({
      where: { employeeId: empId, tenantId, isActive: true },
      include: [{ model: AllowanceType, as: 'allowanceType', attributes: ['name'], required: false }],
    });
    const totalAllowances = empAllowances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
    const allowanceBreakdown = empAllowances.map(a => ({ name: a.allowanceType?.name || 'Allowance', amount: parseFloat(a.amount || 0) }));

    // Calculate deductions with names
    const empDeductions = await EmployeeDeduction.findAll({
      where: { employeeId: empId, tenantId, isActive: true },
      include: [{ model: DeductionType, as: 'deductionType', attributes: ['name'], required: false }],
    });
    const totalDeductions = empDeductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const deductionBreakdown = empDeductions.map(d => ({ name: d.deductionType?.name || 'Deduction', amount: parseFloat(d.amount || 0) }));

    // Calculate loan deduction
    const pendingRepayments = await LoanRepayment.findAll({ where: { employeeId: empId, tenantId, status: 'Pending' }, include: [{ model: EmployeeLoan, as: 'loan', where: { status: 'Active' }, required: true }] });
    let loanDeduction = 0;
    for (const rp of pendingRepayments) {
      if (rp.dueDate >= period.startDate && rp.dueDate <= period.endDate) {
        loanDeduction += parseFloat(rp.amount);
        await rp.update({ status: 'Paid', paidDate: new Date().toISOString().split('T')[0], payrollRunId: run.id });
      }
    }

    // Calculate overtime
    const overtimePay = 0; // Simplified; would integrate with overtime module

    const basicSalary = parseFloat(sal.basicSalary);
    const grossPay = basicSalary + totalAllowances + overtimePay;
    const totalDeduct = totalDeductions + loanDeduction;
    const netPay = grossPay - totalDeduct;
    const employerContributions = 0; // Simplified

    details.push({
      payrollRunId: run.id, employeeId: empId,
      basicSalary, allowances: totalAllowances, deductions: totalDeduct,
      overtimePay, loanDeduction,
      grossPay, netPay, employerContributions,
      workingDays: 30, paidDays: 30, absentDays: 0, overtimeHours: 0,
      tenantId, createdBy: userId,
    });

    // Generate payslip
    const payslipNumber = `PS-${runNumber.replace('PR-', '')}-${String(totalGross).padStart(4, '0')}`;
    await Payslip.create({
      tenantId, payslipNumber: `PS-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      payrollRunId: run.id, employeeId: empId,
      periodStart: period.startDate, periodEnd: period.endDate,
      basicSalary, grossPay, netPay,
      allowanceBreakdown: allowanceBreakdown,
      deductionBreakdown: deductionBreakdown,
      status: 'Generated', generatedAt: new Date(),
      createdBy: userId,
    });

    totalGross += grossPay;
    totalDeductions += totalDeduct;
    totalNet += netPay;
    totalEmployer += employerContributions;
  }

  // Bulk create payroll details
  if (details.length > 0) await PayrollDetail.bulkCreate(details);

  // Update run totals
  await run.update({
    totalEmployees: details.length, totalGross, totalDeductions, totalNetPay: totalNet,
    totalEmployerContributions: totalEmployer, status: 'Processed', processedAt: new Date(), updatedBy: userId,
  });

  // Update period status
  await period.update({ status: 'Processing', updatedBy: userId });

  return toPR(await payrollRunRepo.findById(run.id, tenantId));
};

const approvePayroll = async (runId, tenantId, userId) => {
  const run = await payrollRunRepo.findById(runId, tenantId);
  if (!run) throw new NotFoundError('Payroll run not found');
  if (run.status !== 'Processed') throw new BadRequestError('Only processed runs can be approved');
  await PayrollRun.update({ status: 'Approved', approvedBy: userId, approvedAt: new Date(), updatedBy: userId }, { where: { id: runId, tenantId } });
  // Lock the period
  const period = await payrollPeriodRepo.findById(run.periodId, tenantId);
  if (period) await period.update({ status: 'Closed', isLocked: true, updatedBy: userId });
  return toPR(await payrollRunRepo.findById(runId, tenantId));
};

const reversePayroll = async (runId, tenantId, userId) => {
  const run = await payrollRunRepo.findById(runId, tenantId);
  if (!run) throw new NotFoundError('Payroll run not found');
  if (run.status === 'Reversed') throw new BadRequestError('Run is already reversed');
  await PayrollRun.update({ status: 'Reversed', reversedAt: new Date(), updatedBy: userId }, { where: { id: runId, tenantId } });
  // Revert loan repayments
  await LoanRepayment.update({ status: 'Pending', paidDate: null, payrollRunId: null }, { where: { payrollRunId: runId, tenantId } });
  return { success: true, message: 'Payroll reversed successfully' };
};

const processExistingRun = async (runId, tenantId, userId) => {
  const run = await payrollRunRepo.findById(runId, tenantId);
  if (!run) throw new NotFoundError('Payroll run not found');
  if (run.status !== 'Draft') throw new BadRequestError('Only draft runs can be processed');

  const period = await payrollPeriodRepo.findById(run.periodId, tenantId);
  if (!period) throw new NotFoundError('Period not found');

  // Get active employees
  const activeSalaries = await EmployeeSalary.findAll({
    where: { tenantId, isActive: true },
    include: [{ model: Employee, as: 'employee', where: { status: 'Active' }, required: true }],
  });

  let totalGross = 0, totalDeductions = 0, totalNet = 0;
  const details = [];

  for (const sal of activeSalaries) {
    const empId = sal.employeeId;
    const allowances = await EmployeeAllowance.sum('amount', { where: { employeeId: empId, tenantId, isActive: true } }) || 0;
    const deductions = await EmployeeDeduction.sum('amount', { where: { employeeId: empId, tenantId, isActive: true } }) || 0;
    const basicSalary = parseFloat(sal.basicSalary);
    const grossPay = basicSalary + allowances;
    const netPay = grossPay - deductions;

    details.push({
      payrollRunId: run.id, employeeId: empId,
      basicSalary, allowances, deductions, overtimePay: 0, loanDeduction: 0,
      grossPay, netPay, employerContributions: 0,
      workingDays: 30, paidDays: 30, absentDays: 0, overtimeHours: 0,
      tenantId, createdBy: userId,
    });

    totalGross += grossPay;
    totalDeductions += deductions;
    totalNet += netPay;
  }

  if (details.length > 0) await PayrollDetail.bulkCreate(details);

  await run.update({
    totalEmployees: details.length, totalGross, totalDeductions, totalNetPay: totalNet,
    status: 'Processed', processedAt: new Date(), updatedBy: userId,
  });

  return toPR(await payrollRunRepo.findById(runId, tenantId));
};

module.exports = {
  salaryStructureSvc, salaryComponentSvc, employeeSalarySvc,
  allowanceTypeSvc, empAllowanceSvc, deductionTypeSvc, empDeductionSvc,
  employeeLoanSvc, loanRepaymentSvc,
  payrollPeriodSvc, payrollRunSvc, payrollDetailSvc, payslipSvc,
  processPayroll, approvePayroll, reversePayroll, processExistingRun,
};
