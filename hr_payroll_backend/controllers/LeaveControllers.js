const { LeaveTypeService, LeaveApplicationService, LeaveBalanceService, HolidayService } = require('../services/LeaveServices');
const ApiResponse = require('../utils/apiResponse');

const makeCtrl = (service) => ({
  getAll: async (req, res, next) => { try { const r = await service.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await service.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await service.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await service.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await service.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
});

const leaveTypeCtrl = makeCtrl(LeaveTypeService);
const holidayCtrl = makeCtrl(HolidayService);

const leaveBalanceCtrl = {
  ...makeCtrl(LeaveBalanceService),
  initializeForEmployee: async (req, res, next) => { try { const d = await LeaveBalanceService.initializeForEmployee(req.body.employeeId, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
};

const leaveAppCtrl = {
  getAll: async (req, res, next) => { try { const r = await LeaveApplicationService.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await LeaveApplicationService.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await LeaveApplicationService.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await LeaveApplicationService.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await LeaveApplicationService.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
  approve: async (req, res, next) => { try { const d = await LeaveApplicationService.approve(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Leave approved' }); } catch (e) { next(e); } },
  reject: async (req, res, next) => { try { const d = await LeaveApplicationService.reject(req.params.id, req.tenantId, req.userId, req.body.reason); return ApiResponse.success(res, { data: d, message: 'Leave rejected' }); } catch (e) { next(e); } },
  getSummary: async (req, res, next) => { try { const d = await LeaveApplicationService.getSummary(req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
};

module.exports = { leaveTypeCtrl, leaveAppCtrl, leaveBalanceCtrl, holidayCtrl };
