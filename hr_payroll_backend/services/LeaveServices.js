const ltRepo = require('../repositories/LeaveTypeRepository');
const laRepo = require('../repositories/LeaveApplicationRepository');
const lbRepo = require('../repositories/LeaveBalanceRepository');
const hRepo = require('../repositories/HolidayRepository');
const { ConflictError, NotFoundError, BadRequestError } = require('../utils/appError');
const logger = require('../utils/logger');

// ── LeaveType Service ──
const leaveTypeToDTO = (l) => l ? { id: l.id, tenantId: l.tenantId, code: l.code, name: l.name, nameAr: l.nameAr, leaveCategory: l.leaveCategory, isPaid: l.isPaid, maxDaysPerYear: l.maxDaysPerYear, maxDaysPerRequest: l.maxDaysPerRequest, minDaysPerRequest: l.minDaysPerRequest, requiresApproval: l.requiresApproval, requiresDocuments: l.requiresDocuments, allowNegativeBalance: l.allowNegativeBalance, isActive: l.isActive, description: l.description, color: l.color, createdAt: l.createdAt, updatedAt: l.updatedAt } : null;

class LeaveTypeService {
  async getAll(tenantId, query) { const r = await ltRepo.findAll({ tenantId, query }); r.data = r.data.map(leaveTypeToDTO); return r; }
  async getById(id, tenantId) { const l = await ltRepo.findById(id, tenantId); if (!l) throw new NotFoundError('Leave type not found'); return leaveTypeToDTO(l); }
  async create(data, tenantId, userId) { const ex = await ltRepo.findByCode(data.code, tenantId); if (ex) throw new ConflictError(`Leave type code '${data.code}' already exists`); return leaveTypeToDTO(await ltRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId })); }
  async update(id, data, tenantId, userId) { const l = await ltRepo.findById(id, tenantId); if (!l) throw new NotFoundError('Leave type not found'); if (data.code && data.code !== l.code) { const ex = await ltRepo.findByCode(data.code, tenantId, id); if (ex) throw new ConflictError(`Leave type code '${data.code}' already exists`); } await ltRepo.update(id, tenantId, { ...data, updatedBy: userId }); return leaveTypeToDTO(await ltRepo.findById(id, tenantId)); }
  async delete(id, tenantId) { const l = await ltRepo.findById(id, tenantId); if (!l) throw new NotFoundError('Leave type not found'); await ltRepo.delete(id, tenantId); return { success: true }; }
}

// ── LeaveApplication Service ──
const appToDTO = (a) => a ? {
  id: a.id, tenantId: a.tenantId, applicationNumber: a.applicationNumber, employeeId: a.employeeId, leaveTypeId: a.leaveTypeId,
  startDate: a.startDate, endDate: a.endDate, totalDays: parseFloat(a.totalDays), reason: a.reason, status: a.status,
  contactDetails: a.contactDetails, attachmentPath: a.attachmentPath, submittedAt: a.submittedAt,
  employee: a.employee ? { id: a.employee.id, employeeCode: a.employee.employeeCode, name: `${a.employee.firstName} ${a.employee.lastName}` } : null,
  leaveType: a.leaveType ? { id: a.leaveType.id, code: a.leaveType.code, name: a.leaveType.name, leaveCategory: a.leaveType.leaveCategory, isPaid: a.leaveType.isPaid } : null,
  approvals: (a.approvals || []).map(ap => ({ id: ap.id, approverId: ap.approverId, approvalLevel: ap.approvalLevel, status: ap.status, comments: ap.comments, decidedAt: ap.decidedAt })),
  createdAt: a.createdAt, updatedAt: a.updatedAt,
} : null;

class LeaveApplicationService {
  async getAll(tenantId, query) { const r = await laRepo.findAll({ tenantId, query }); r.data = r.data.map(appToDTO); return r; }
  async getById(id, tenantId) { const a = await laRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Leave application not found'); return appToDTO(a); }

  async create(data, tenantId, userId) {
    // Auto-generate application number
    data.applicationNumber = await laRepo.getNextApplicationNumber(tenantId);

    // Calculate total days
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate); const end = new Date(data.endDate);
      data.totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check leave balance
    if (data.employeeId && data.leaveTypeId) {
      const year = new Date(data.startDate).getFullYear();
      const balance = await lbRepo.findByEmployeeAndType(data.employeeId, data.leaveTypeId, year, tenantId);
      const leaveType = await ltRepo.findById(data.leaveTypeId, tenantId);
      if (leaveType && !leaveType.allowNegativeBalance && balance) {
        if (parseFloat(balance.availableBalance) < data.totalDays) {
          throw new BadRequestError(`Insufficient leave balance. Available: ${balance.availableBalance}, Requested: ${data.totalDays}`);
        }
      }
    }

    const app = await laRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId, status: data.status || 'Submitted', submittedAt: data.status === 'Submitted' ? new Date() : null });

    // Create approval record if status is Submitted
    if (app.status === 'Submitted') {
      const { LeaveApproval } = require('../models');
      const employee = await require('../models').Employee.findByPk(data.employeeId);
      if (employee?.reportingManagerId) {
        await LeaveApproval.create({ tenantId, leaveApplicationId: app.id, approverId: employee.reportingManagerId, approvalLevel: 1, status: 'Pending', createdBy: userId });
      }
    }

    return appToDTO(await laRepo.findById(app.id, tenantId));
  }

  async update(id, data, tenantId, userId) {
    const a = await laRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Leave application not found');
    await laRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return appToDTO(await laRepo.findById(id, tenantId));
  }

  async delete(id, tenantId) { const a = await laRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Leave application not found'); await laRepo.delete(id, tenantId); return { success: true }; }

  async approve(id, tenantId, userId) {
    const a = await laRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Leave application not found');
    // Update approval record
    const { LeaveApproval } = require('../models');
    await LeaveApproval.update({ status: 'Approved', comments: 'Approved', decidedAt: new Date() }, { where: { leaveApplicationId: id, approverId: userId, status: 'Pending' } });
    // Update application status
    await laRepo.update(id, tenantId, { status: 'Approved', updatedBy: userId });
    // Deduct from balance
    const year = new Date(a.startDate).getFullYear();
    const balance = await lbRepo.findByEmployeeAndType(a.employeeId, a.leaveTypeId, year, tenantId);
    if (balance) {
      const newUsed = parseFloat(balance.usedDays) + parseFloat(a.totalDays);
      const newAvailable = parseFloat(balance.openingBalance) + parseFloat(balance.accruedDays) - newUsed;
      await lbRepo.update(balance.id, tenantId, { usedDays: newUsed, pendingDays: Math.max(0, parseFloat(balance.pendingDays) - parseFloat(a.totalDays)), availableBalance: newAvailable, updatedBy: userId });
    }
    return appToDTO(await laRepo.findById(id, tenantId));
  }

  async reject(id, tenantId, userId, reason) {
    const a = await laRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Leave application not found');
    const { LeaveApproval } = require('../models');
    await LeaveApproval.update({ status: 'Rejected', comments: reason || 'Rejected', decidedAt: new Date() }, { where: { leaveApplicationId: id, approverId: userId, status: 'Pending' } });
    await laRepo.update(id, tenantId, { status: 'Rejected', updatedBy: userId });
    return appToDTO(await laRepo.findById(id, tenantId));
  }

  async getSummary(tenantId) { return laRepo.countByStatus(tenantId); }
}

// ── LeaveBalance Service ──
const balToDTO = (b) => b ? { id: b.id, tenantId: b.tenantId, employeeId: b.employeeId, leaveTypeId: b.leaveTypeId, year: b.year, openingBalance: parseFloat(b.openingBalance), accruedDays: parseFloat(b.accruedDays), usedDays: parseFloat(b.usedDays), pendingDays: parseFloat(b.pendingDays), availableBalance: parseFloat(b.availableBalance), carryForwardDays: parseFloat(b.carryForwardDays), notes: b.notes, employee: b.employee ? { id: b.employee.id, employeeCode: b.employee.employeeCode, name: `${b.employee.firstName} ${b.employee.lastName}` } : null, leaveType: b.leaveType ? { id: b.leaveType.id, code: b.leaveType.code, name: b.leaveType.name, leaveCategory: b.leaveType.leaveCategory, isPaid: b.leaveType.isPaid, color: b.leaveType.color } : null, createdAt: b.createdAt, updatedAt: b.updatedAt } : null;

class LeaveBalanceService {
  async getAll(tenantId, query) { const r = await lbRepo.findAll({ tenantId, query }); r.data = r.data.map(balToDTO); return r; }
  async getById(id, tenantId) { const b = await lbRepo.findById(id, tenantId); if (!b) throw new NotFoundError('Leave balance not found'); return balToDTO(b); }
  async create(data, tenantId, userId) {
    const existing = await lbRepo.findByEmployeeAndType(data.employeeId, data.leaveTypeId, data.year, tenantId);
    if (existing) return balToDTO(existing);
    const avail = (parseFloat(data.openingBalance || 0) + parseFloat(data.accruedDays || 0)) - parseFloat(data.usedDays || 0);
    return balToDTO(await lbRepo.create({ ...data, availableBalance: avail, tenantId, createdBy: userId, updatedBy: userId }));
  }
  async update(id, data, tenantId, userId) {
    const b = await lbRepo.findById(id, tenantId); if (!b) throw new NotFoundError('Leave balance not found');
    await lbRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return balToDTO(await lbRepo.findById(id, tenantId));
  }
  async delete(id, tenantId) { const b = await lbRepo.findById(id, tenantId); if (!b) throw new NotFoundError('Leave balance not found'); await lbRepo.delete(id, tenantId); return { success: true }; }

  async initializeForEmployee(employeeId, tenantId, userId) {
    // Create leave balances for all active leave types for the current year
    const leaveTypes = await ltRepo.findAll({ tenantId, query: { limit: 100, isActive: 'true' } });
    const year = new Date().getFullYear();
    const results = [];
    for (const lt of leaveTypes.data) {
      const existing = await lbRepo.findByEmployeeAndType(employeeId, lt.id, year, tenantId);
      if (!existing) {
        const opening = lt.maxDaysPerYear ? parseFloat(lt.maxDaysPerYear) : 0;
        results.push(await lbRepo.create({ employeeId, leaveTypeId: lt.id, year, openingBalance: opening, accruedDays: 0, usedDays: 0, pendingDays: 0, availableBalance: opening, tenantId, createdBy: userId, updatedBy: userId }));
      }
    }
    return results.map(balToDTO);
  }
}

// ── Holiday Service ──
const holToDTO = (h) => h ? { id: h.id, tenantId: h.tenantId, name: h.name, nameAr: h.nameAr, holidayDate: h.holidayDate, endDate: h.endDate, isRecurringYearly: h.isRecurringYearly, holidayType: h.holidayType, description: h.description, isActive: h.isActive, createdAt: h.createdAt, updatedAt: h.updatedAt } : null;

class HolidayService {
  async getAll(tenantId, query) { const r = await hRepo.findAll({ tenantId, query }); r.data = r.data.map(holToDTO); return r; }
  async getById(id, tenantId) { const h = await hRepo.findById(id, tenantId); if (!h) throw new NotFoundError('Holiday not found'); return holToDTO(h); }
  async create(data, tenantId, userId) { const ex = await hRepo.findByDate(data.holidayDate, tenantId); if (ex) throw new ConflictError('A holiday already exists on this date'); return holToDTO(await hRepo.create({ ...data, tenantId, createdBy: userId, updatedBy: userId })); }
  async update(id, data, tenantId, userId) { const h = await hRepo.findById(id, tenantId); if (!h) throw new NotFoundError('Holiday not found'); if (data.holidayDate && data.holidayDate !== h.holidayDate) { const ex = await hRepo.findByDate(data.holidayDate, tenantId, id); if (ex) throw new ConflictError('A holiday already exists on this date'); } await hRepo.update(id, tenantId, { ...data, updatedBy: userId }); return holToDTO(await hRepo.findById(id, tenantId)); }
  async delete(id, tenantId) { const h = await hRepo.findById(id, tenantId); if (!h) throw new NotFoundError('Holiday not found'); await hRepo.delete(id, tenantId); return { success: true }; }
}

module.exports = { LeaveTypeService: new LeaveTypeService(), LeaveApplicationService: new LeaveApplicationService(), LeaveBalanceService: new LeaveBalanceService(), HolidayService: new HolidayService() };
