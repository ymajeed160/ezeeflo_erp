const shiftService = require('../services/ShiftService');
const attendanceService = require('../services/AttendanceService');
const saService = require('../services/ShiftAssignmentService');
const rosterService = require('../services/RosterService');
const overtimeService = require('../services/OvertimeService');
const ApiResponse = require('../utils/apiResponse');

// Generic CRUD controller factory
const makeCtrl = (service) => ({
  getAll: async (req, res, next) => { try { const r = await service.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await service.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await service.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await service.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await service.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
});

const shiftCtrl = makeCtrl(shiftService);
const saCtrl = makeCtrl(saService);
const rosterCtrl = {
  ...makeCtrl(rosterService),
  bulkCreate: async (req, res, next) => { try { const r = await rosterService.bulkCreate(req.body.records, req.tenantId, req.userId); return ApiResponse.created(res, { data: r }); } catch (e) { next(e); } },
  generate: async (req, res, next) => { try { const r = await rosterService.generateRoster(req.tenantId, req.body.dateFrom, req.body.dateTo, req.userId); return ApiResponse.created(res, { data: r }); } catch (e) { next(e); } },
};
const overtimeCtrl = {
  ...makeCtrl(overtimeService),
  approve: async (req, res, next) => { try { const d = await overtimeService.approve(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
};

const attendanceCtrl = {
  getAll: async (req, res, next) => { try { const r = await attendanceService.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await attendanceService.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  markAttendance: async (req, res, next) => { try { const d = await attendanceService.markAttendance(req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Attendance marked' }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await attendanceService.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await attendanceService.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
  getTodaySummary: async (req, res, next) => { try { const d = await attendanceService.getTodaySummary(req.tenantId, req.query.employeeId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  bulkMark: async (req, res, next) => { try { const d = await attendanceService.bulkMark(req.body.records, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
};

module.exports = { shiftCtrl, saCtrl, rosterCtrl, overtimeCtrl, attendanceCtrl };
