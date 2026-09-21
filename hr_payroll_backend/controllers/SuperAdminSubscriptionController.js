const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { SubscriptionPlan, CompanyModule, SuperAdminCompany } = require('../models');
const superAdminRepo = require('../repositories/SuperAdminRepository');

const DEFAULT_MODULES = [
  { code: 'employees', name: 'Employees' },
  { code: 'attendance', name: 'Attendance' },
  { code: 'leave', name: 'Leave Management' },
  { code: 'payroll', name: 'Payroll' },
  { code: 'recruitment', name: 'Recruitment' },
  { code: 'training', name: 'Training' },
  { code: 'performance', name: 'Performance' },
  { code: 'documents', name: 'Documents' },
  { code: 'reports', name: 'Reports' },
  { code: 'settings', name: 'Settings' },
  { code: 'master_data', name: 'Master Data' },
  { code: 'security', name: 'Security' },
  { code: 'ess', name: 'Employee Self Service' },
  { code: 'benefits', name: 'Benefits & EOSB' },
];

// ── SUBSCRIPTION PLANS ──

const listPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['sortOrder', 'ASC']] });
    return ApiResponse.success(res, { data: plans });
  } catch (error) {
    logger.error('List plans error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch plans' });
  }
};

const getPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return ApiResponse.notFound(res, { message: 'Plan not found' });
    return ApiResponse.success(res, { data: plan });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to fetch plan' });
  }
};

const createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create({ ...req.body, createdBy: req.superAdminId });
    return ApiResponse.created(res, { message: 'Plan created', data: plan });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to create plan' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return ApiResponse.notFound(res, { message: 'Plan not found' });
    await plan.update({ ...req.body, updatedBy: req.superAdminId });
    return ApiResponse.success(res, { message: 'Plan updated', data: plan });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to update plan' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return ApiResponse.notFound(res, { message: 'Plan not found' });
    await plan.destroy();
    return ApiResponse.success(res, { message: 'Plan deleted' });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to delete plan' });
  }
};

// ── MODULE MANAGEMENT ──

const listModules = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return ApiResponse.success(res, { data: DEFAULT_MODULES.map(m => ({ ...m, isEnabled: true })) });
    }

    const modules = await CompanyModule.findAll({ where: { companyId } });
    const result = DEFAULT_MODULES.map(def => {
      const found = modules.find(m => m.moduleCode === def.code);
      return { ...def, isEnabled: found ? found.isEnabled : true, id: found?.id };
    });

    return ApiResponse.success(res, { data: result });
  } catch (error) {
    logger.error('List modules error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch modules' });
  }
};

const toggleModule = async (req, res) => {
  try {
    const { companyId, moduleCode, isEnabled } = req.body;
    if (!companyId || !moduleCode) {
      return ApiResponse.badRequest(res, { message: 'companyId and moduleCode required' });
    }

    const def = DEFAULT_MODULES.find(m => m.code === moduleCode);
    if (!def) return ApiResponse.badRequest(res, { message: 'Invalid module code' });

    let module = await CompanyModule.findOne({ where: { companyId, moduleCode } });
    if (module) {
      await module.update({ isEnabled, updatedBy: req.superAdminId });
    } else {
      module = await CompanyModule.create({
        companyId, moduleCode, moduleName: def.name, isEnabled, createdBy: req.superAdminId,
      });
    }

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: isEnabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
      entityType: 'module',
      entityId: companyId,
      description: `${isEnabled ? 'Enabled' : 'Disabled'} module "${def.name}" for company`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: `Module ${isEnabled ? 'enabled' : 'disabled'}`, data: module });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to toggle module' });
  }
};

const assignModulesToCompany = async (req, res) => {
  try {
    const { companyId, modules } = req.body; // modules: [{ moduleCode, isEnabled }]
    if (!companyId) return ApiResponse.badRequest(res, { message: 'companyId required' });

    for (const mod of modules || []) {
      const def = DEFAULT_MODULES.find(m => m.code === mod.moduleCode);
      if (!def) continue;
      await CompanyModule.upsert({
        companyId, moduleCode: mod.moduleCode, moduleName: def.name,
        isEnabled: mod.isEnabled, createdBy: req.superAdminId,
      });
    }

    return ApiResponse.success(res, { message: 'Modules assigned' });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to assign modules' });
  }
};

// ── SEED DEFAULT PLANS ──

const seedDefaultPlans = async (req, res) => {
  try {
    const existing = await SubscriptionPlan.count();
    if (existing > 0) {
      return ApiResponse.success(res, { message: 'Plans already exist' });
    }

    const plans = [
      {
        name: 'Starter', code: 'starter', price: 0,
        maxEmployees: 25, maxUsers: 5, maxBranches: 3, maxDepartments: 5,
        maxPayrollRuns: 12, storageLimitMb: 512, maxApiRequests: 5000,
        gracePeriodDays: 7, sortOrder: 1,
        enabledModules: ['employees', 'attendance', 'leave', 'payroll', 'settings', 'master_data', 'security'],
      },
      {
        name: 'Professional', code: 'professional', price: 99,
        maxEmployees: 100, maxUsers: 20, maxBranches: 10, maxDepartments: 20,
        maxPayrollRuns: 24, storageLimitMb: 2048, maxApiRequests: 20000,
        gracePeriodDays: 15, sortOrder: 2,
        enabledModules: ['employees', 'attendance', 'leave', 'payroll', 'recruitment', 'training', 'reports', 'settings', 'master_data', 'security', 'benefits'],
      },
      {
        name: 'Enterprise', code: 'enterprise', price: 299,
        maxEmployees: 500, maxUsers: 100, maxBranches: 50, maxDepartments: 100,
        maxPayrollRuns: 52, storageLimitMb: 10240, maxApiRequests: 100000,
        gracePeriodDays: 30, sortOrder: 3,
        enabledModules: DEFAULT_MODULES.map(m => m.code),
      },
      {
        name: 'Custom', code: 'custom', price: 0,
        maxEmployees: 50, maxUsers: 10, maxBranches: 5, maxDepartments: 10,
        maxPayrollRuns: 12, storageLimitMb: 1024, maxApiRequests: 10000,
        gracePeriodDays: 15, sortOrder: 99,
        enabledModules: DEFAULT_MODULES.map(m => m.code),
      },
    ];

    await SubscriptionPlan.bulkCreate(plans.map(p => ({ ...p, createdBy: req.superAdminId })));
    return ApiResponse.created(res, { message: 'Default plans seeded', data: plans });
  } catch (error) {
    logger.error('Seed plans error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to seed plans' });
  }
};

module.exports = {
  listPlans, getPlan, createPlan, updatePlan, deletePlan, seedDefaultPlans,
  listModules, toggleModule, assignModulesToCompany,
};
