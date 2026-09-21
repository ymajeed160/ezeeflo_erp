const { Op } = require('sequelize');
const { PerformanceGoal, PerformanceKpi, PerformanceAppraisal, TrainingCourse, TrainingSession, TrainingAttendee, JobPosition, JobApplicant, Interview, OfferLetter, OnboardingChecklist, OnboardingProgress, OffboardingChecklist, OffboardingProgress, ExitInterview, Employee, Department, Designation } = require('../models');
const { NotFoundError } = require('../utils/appError');

const makeRepo = (Model, searchFields = ['code', 'name'], includes = []) => ({
  findAll: async ({ tenantId, query = {} }) => {
    const { page = 1, limit = 10, search = '', employeeId } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (search) where[Op.or] = searchFields.map(f => ({ [f]: { [Op.like]: `%${search}%` } }));
    const opts = { where, order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true };
    if (includes.length) opts.include = includes;
    const { count, rows } = await Model.findAndCountAll(opts);
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)), hasNext: offset + parseInt(limit) < count, hasPrev: parseInt(page) > 1 } };
  },
  findById: async (id, tenantId) => Model.findOne({ where: { id, tenantId }, include: includes.length ? includes : undefined }),
  create: async (data) => Model.create(data),
  update: async (id, tenantId, data) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.update(data); },
  delete: async (id, tenantId) => { const r = await Model.findOne({ where: { id, tenantId } }); if (!r) return null; return r.destroy(); },
});

const empBase = [{ model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }];

// Performance repos
const pgRepo = makeRepo(PerformanceGoal, ['title'], empBase);
const pkRepo = makeRepo(PerformanceKpi);
const paRepo = makeRepo(PerformanceAppraisal, [], [...empBase, { model: Employee, as: 'appraiser', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }]);

// Training repos
const tcRepo = makeRepo(TrainingCourse);
const tsRepo = makeRepo(TrainingSession, ['sessionName'], [{ model: TrainingCourse, as: 'course', attributes: ['id', 'code', 'name'], required: false }]);
const taRepo = makeRepo(TrainingAttendee, [], [...empBase, { model: TrainingSession, as: 'session', attributes: ['id', 'sessionName', 'startDate'], required: false }]);

// Recruitment repos
const jpRepo = makeRepo(JobPosition, ['title', 'positionCode'], [{ model: Department, as: 'department', attributes: ['id', 'code', 'name'], required: false }, { model: Designation, as: 'designation', attributes: ['id', 'code', 'name'], required: false }]);
const jaRepo = makeRepo(JobApplicant, ['firstName', 'lastName', 'email', 'applicantNumber'], [{ model: JobPosition, as: 'position', attributes: ['id', 'positionCode', 'title'], required: false }]);
const ivRepo = makeRepo(Interview, [], [{ model: JobApplicant, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'applicantNumber'], required: false }, { model: Employee, as: 'interviewer', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], required: false }]);
const olRepo = makeRepo(OfferLetter, ['offerNumber'], [{ model: JobApplicant, as: 'applicant', attributes: ['id', 'firstName', 'lastName'], required: false }]);

// OnOffboarding repos
const oncRepo = makeRepo(OnboardingChecklist, ['taskName']);
const onpRepo = makeRepo(OnboardingProgress, [], [...empBase, { model: OnboardingChecklist, as: 'checklist', attributes: ['id', 'taskName', 'category'], required: false }]);
const ofcRepo = makeRepo(OffboardingChecklist, ['taskName']);
const ofpRepo = makeRepo(OffboardingProgress, [], [...empBase, { model: OffboardingChecklist, as: 'checklist', attributes: ['id', 'taskName', 'category'], required: false }]);
const eiRepo = makeRepo(ExitInterview, [], empBase);

const makeSvc = (repo) => ({
  getAll: async (tId, q) => { const r = await repo.findAll({ tenantId: tId, query: q }); return r; },
  getById: async (id, tId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); return d; },
  create: async (data, tId, uId) => repo.create({ ...data, tenantId: tId, createdBy: uId, updatedBy: uId }),
  update: async (id, data, tId, uId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); await repo.update(id, tId, { ...data, updatedBy: uId }); return repo.findById(id, tId); },
  delete: async (id, tId) => { const d = await repo.findById(id, tId); if (!d) throw new NotFoundError('Not found'); await repo.delete(id, tId); return { success: true }; },
});

// Job Applicant auto-number
const jaSvc = {
  ...makeSvc(jaRepo),
  create: async (data, tId, uId) => {
    data.applicantNumber = `APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    return jaRepo.create({ ...data, tenantId: tId, createdBy: uId, updatedBy: uId });
  },
};

// Offer Letter auto-number
const olSvc = {
  ...makeSvc(olRepo),
  create: async (data, tId, uId) => {
    data.offerNumber = `OL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    return olRepo.create({ ...data, tenantId: tId, createdBy: uId, updatedBy: uId });
  },
};

// Onboarding: initialize for employee
const onpSvc = {
  ...makeSvc(onpRepo),
  initializeForEmployee: async (employeeId, tId, uId) => {
    const checklists = await OnboardingChecklist.findAll({ where: { tenantId: tId, isActive: true } });
    const results = [];
    for (const c of checklists) {
      const existing = await OnboardingProgress.findOne({ where: { employeeId, checklistId: c.id, tenantId: tId } });
      if (!existing) results.push(await OnboardingProgress.create({ employeeId, checklistId: c.id, status: 'Pending', tenantId: tId, createdBy: uId }));
    }
    return results;
  },
};

// Offboarding: initialize for employee
const ofpSvc = {
  ...makeSvc(ofpRepo),
  initializeForEmployee: async (employeeId, tId, uId) => {
    const checklists = await OffboardingChecklist.findAll({ where: { tenantId: tId, isActive: true } });
    const results = [];
    for (const c of checklists) {
      const existing = await OffboardingProgress.findOne({ where: { employeeId, checklistId: c.id, tenantId: tId } });
      if (!existing) results.push(await OffboardingProgress.create({ employeeId, checklistId: c.id, status: 'Pending', tenantId: tId, createdBy: uId }));
    }
    return results;
  },
};

module.exports = {
  pgSvc: makeSvc(pgRepo), pkSvc: makeSvc(pkRepo), paSvc: makeSvc(paRepo),
  tcSvc: makeSvc(tcRepo), tsSvc: makeSvc(tsRepo), taSvc: makeSvc(taRepo),
  jpSvc: makeSvc(jpRepo), jaSvc, ivSvc: makeSvc(ivRepo), olSvc,
  oncSvc: makeSvc(oncRepo), onpSvc,
  ofcSvc: makeSvc(ofcRepo), ofpSvc, eiSvc: makeSvc(eiRepo),
};
