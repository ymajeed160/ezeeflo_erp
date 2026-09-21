const { Op } = require('sequelize');
const { BenefitType, EmployeeBenefit, EosbCalculation, EosbSettlement, WpsConfiguration, WpsExport, EssSubmission, Employee, PayrollRun } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/appError');

// ── Generic Repo ──
const makeRepo = (Model, searchFields = ['code', 'name'], includes = []) => ({
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, search = '', employeeId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (search) where[Op.or] = searchFields.map(f => ({ [f]: { [Op.like]: `%${search}%` } }));
    const opts = { where, order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true };
    if (includes.length > 0) opts.include = includes;
    const { count, rows } = await Model.findAndCountAll(opts);
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
  findById: async (id, tenantId) => Model.findOne({ where: { id, tenantId }, include: includes.length > 0 ? includes : undefined }),
  create: async (data) => Model.create(data),
  update: async (id, tenantId, data) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.update(data); },
  delete: async (id, tenantId) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.destroy(); },
});

const empBase = [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }];
const btRepo = makeRepo(BenefitType);
const ebRepo = makeRepo(EmployeeBenefit, [], [...empBase, { model: BenefitType, as: 'benefitType', attributes: ['id', 'code', 'name', 'benefitCategory'], required: false }]);
const ecRepo = makeRepo(EosbCalculation, [], empBase);
const esRepo = makeRepo(EosbSettlement, [], empBase);
const wcRepo = makeRepo(WpsConfiguration, ['configName']);
const weRepo = makeRepo(WpsExport, ['exportNumber'], [{ model: WpsConfiguration, as: 'config', attributes: ['id', 'configName', 'fileFormat'], required: false }, { model: PayrollRun, as: 'payrollRun', attributes: ['id', 'runNumber'], required: false }]);
const essRepo = makeRepo(EssSubmission, ['title'], empBase);

// ── Services ──
const makeSvc = (repo) => ({
  getAll: async (tId, q) => { const r = await repo.findAll({ tenantId: tId, query: q }); return r; },
  getById: async (id, tId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); return d; },
  create: async (data, tId, uId) => repo.create({ ...data, tenantId: tId, createdBy: uId, updatedBy: uId }),
  update: async (id, data, tId, uId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); await repo.update(id, tId, { ...data, updatedBy: uId }); return repo.findById(id, tId); },
  delete: async (id, tId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); await repo.delete(id, tId); return { success: true }; },
});

// EOSB Calculation Service
const eosbCalcSvc = {
  ...makeSvc(ecRepo),
  calculate: async (data, tId, uId) => {
    const emp = await Employee.findByPk(data.employeeId);
    if (!emp) throw new NotFoundError('Employee not found');
    const joiningDateRaw = emp.joiningDate ?? data.joiningDate;
    if (!joiningDateRaw) throw new NotFoundError('Joining date not available for employee. Please set a joining date.');
    const joiningDate = new Date(joiningDateRaw);
    const lastWorkingDate = new Date(data.lastWorkingDate || new Date());
    if (isNaN(joiningDate.getTime()) || isNaN(lastWorkingDate.getTime())) throw new NotFoundError('Invalid date value');
    const yearsOfService = (lastWorkingDate - joiningDate) / (365.25 * 24 * 60 * 60 * 1000);

    const basicSalary = parseFloat(emp.basicSalary ?? data.basicSalary ?? emp.totalSalary ?? 0);
    const dailyWage = basicSalary / 30;
    const terminationType = data.terminationType || 'Resignation';

    let first5YearsAmount = 0, after5YearsAmount = 0;

    if (terminationType === 'Resignation') {
      if (yearsOfService >= 1 && yearsOfService < 3) {
        first5YearsAmount = (dailyWage * 21) * Math.min(yearsOfService, 5) / 3;
      } else if (yearsOfService >= 3 && yearsOfService <= 5) {
        first5YearsAmount = (dailyWage * 21) * Math.min(yearsOfService, 5) * (2 / 3);
      } else if (yearsOfService > 5) {
        first5YearsAmount = (dailyWage * 21) * 5 * (2 / 3);
        after5YearsAmount = (dailyWage * 30) * (yearsOfService - 5);
      }
    } else {
      if (yearsOfService <= 5) {
        first5YearsAmount = (dailyWage * 21) * yearsOfService;
      } else {
        first5YearsAmount = (dailyWage * 21) * 5;
        after5YearsAmount = (dailyWage * 30) * (yearsOfService - 5);
      }
    }

    let totalEosb = first5YearsAmount + after5YearsAmount;
    const maxCap = basicSalary * 24; // UAE: 2 years max
    if (totalEosb > maxCap) totalEosb = maxCap;

    // Delete any existing EOSB calculations for this employee (one active calculation per employee)
    await EosbCalculation.destroy({ where: { employeeId: data.employeeId, tenantId: tId } });

    return ecRepo.create({
      employeeId: data.employeeId, calculationDate: new Date().toISOString().split('T')[0],
      joiningDate: emp.joiningDate || joiningDate.toISOString().split('T')[0],
      lastWorkingDate: lastWorkingDate.toISOString().split('T')[0],
      yearsOfService: parseFloat(yearsOfService.toFixed(2)), basicSalary, terminationType,
      dailyWage, first5YearsAmount, after5YearsAmount,
      totalEosbAmount: totalEosb, maxCapAmount: maxCap,
      notes: data.notes, tenantId: tId, createdBy: uId,
    });
  },
};

// EOSB Settlement Service
const eosbSettleSvc = {
  ...makeSvc(esRepo),
  settle: async (data, tId, uId) => {
    const calc = data.calculationId ? await ecRepo.findById(data.calculationId, tId) : null;
    const eosbAmount = parseFloat(calc?.totalEosbAmount || data.eosbAmount || 0);
    const leaveEncashment = parseFloat(data.leaveEncashment || 0);
    const gratuity = parseFloat(data.gratuityAmount || 0);
    const otherDues = parseFloat(data.otherDues || 0);
    const deductions = parseFloat(data.deductions || 0);
    const netSettlement = eosbAmount + leaveEncashment + gratuity + otherDues - deductions;

    const sn = `ES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    return esRepo.create({
      settlementNumber: sn, employeeId: data.employeeId, calculationId: data.calculationId,
      settlementDate: data.settlementDate || new Date().toISOString().split('T')[0],
      eosbAmount, leaveEncashment, gratuityAmount: gratuity, otherDues, deductions,
      netSettlement, paymentMode: data.paymentMode || 'Bank Transfer',
      status: 'Calculated', notes: data.notes,
      tenantId: tId, createdBy: uId, updatedBy: uId,
    });
  },
  approve: async (id, tId, uId) => {
    const s = await esRepo.findById(id, tId); if (!s) throw new NotFoundError('Settlement not found');
    await esRepo.update(id, tId, { status: 'Approved', approvedBy: uId, updatedBy: uId });
    return esRepo.findById(id, tId);
  },
};

// WPS Service
const wpsSvc = {
  ...makeSvc(wcRepo),
  setDefault: async (id, tId, uId) => {
    const c = await wcRepo.findById(id, tId); if (!c) throw new NotFoundError('Config not found');
    await WpsConfiguration.update({ isDefault: false }, { where: { tenantId: tId } });
    await wcRepo.update(id, tId, { isDefault: true, updatedBy: uId });
    return wcRepo.findById(id, tId);
  },
  generateExport: async (data, tId, uId) => {
    const config = data.configId ? await wcRepo.findById(data.configId, tId) : await WpsConfiguration.findOne({ where: { tenantId: tId, isDefault: true } });
    if (!config) throw new BadRequestError('No WPS configuration found');

    // Fetch payroll details
    const payrollRunId = data.payrollRunId;
    const { PayrollDetail, Employee } = require('../models');
    const details = await PayrollDetail.findAll({
      where: { payrollRunId, tenantId: tId },
      include: [{ model: Employee, as: 'employee', required: true }],
    });

    const en = `WPS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const totalAmount = details.reduce((sum, d) => sum + parseFloat(d.netPay), 0);

    const exp = await weRepo.create({
      exportNumber: en, configId: config.id, payrollRunId,
      exportDate: new Date().toISOString().split('T')[0],
      totalEmployees: details.length, totalAmount,
      fileName: `${en}.${config.fileFormat.toLowerCase()}`,
      status: 'Generated', tenantId: tId, createdBy: uId,
    });

    return { ...exp.dataValues, details: details.map(d => ({ employeeName: d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : '', netPay: d.netPay, bankAccount: d.employee?.bankAccountNumber || '' })) };
  },
};

// ESS Service
const essSvc = {
  ...makeSvc(essRepo),
  approve: async (id, tId, uId) => {
    const s = await essRepo.findById(id, tId); if (!s) throw new NotFoundError('Submission not found');
    await essRepo.update(id, tId, { status: 'Approved', reviewedBy: uId, reviewedAt: new Date(), updatedBy: uId });
    return essRepo.findById(id, tId);
  },
  reject: async (id, tId, uId, remarks) => {
    const s = await essRepo.findById(id, tId); if (!s) throw new NotFoundError('Submission not found');
    await essRepo.update(id, tId, { status: 'Rejected', reviewedBy: uId, reviewedAt: new Date(), remarks, updatedBy: uId });
    return essRepo.findById(id, tId);
  },
};

module.exports = {
  btRepo, ebRepo, ecRepo, esRepo, wcRepo, weRepo, essRepo,
  btSvc: makeSvc(btRepo), ebSvc: makeSvc(ebRepo),
  eosbCalcSvc, eosbSettleSvc, wpsSvc, essSvc,
};
