const { pgSvc, pkSvc, paSvc, tcSvc, tsSvc, taSvc, jpSvc, jaSvc, ivSvc, olSvc, oncSvc, onpSvc, ofcSvc, ofpSvc, eiSvc } = require('../services/HRModulesServices');
const ApiResponse = require('../utils/apiResponse');

const makeCtrl = (svc) => ({
  getAll: async (req, res, next) => { try { const r = await svc.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await svc.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await svc.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await svc.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await svc.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
});

module.exports = {
  pgCtrl: makeCtrl(pgSvc), pkCtrl: makeCtrl(pkSvc), paCtrl: makeCtrl(paSvc),
  tcCtrl: makeCtrl(tcSvc), tsCtrl: makeCtrl(tsSvc), taCtrl: makeCtrl(taSvc),
  jpCtrl: makeCtrl(jpSvc), jaCtrl: makeCtrl(jaSvc), ivCtrl: makeCtrl(ivSvc), olCtrl: makeCtrl(olSvc),
  oncCtrl: makeCtrl(oncSvc),
  onpCtrl: { ...makeCtrl(onpSvc), initialize: async (req, res, next) => { try { const d = await onpSvc.initializeForEmployee(req.body.employeeId, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } } },
  ofcCtrl: makeCtrl(ofcSvc),
  ofpCtrl: { ...makeCtrl(ofpSvc), initialize: async (req, res, next) => { try { const d = await ofpSvc.initializeForEmployee(req.body.employeeId, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } } },
  eiCtrl: makeCtrl(eiSvc),
};
