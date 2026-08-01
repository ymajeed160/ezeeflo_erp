const { btSvc, ebSvc, eosbCalcSvc, eosbSettleSvc, wpsSvc, essSvc } = require('../services/BenefitsServices');
const ApiResponse = require('../utils/apiResponse');

const makeCtrl = (svc) => ({
  getAll: async (req, res, next) => { try { const r = await svc.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await svc.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await svc.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await svc.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await svc.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
});

module.exports = {
  btCtrl: makeCtrl(btSvc), ebCtrl: makeCtrl(ebSvc),
  eosbCalcCtrl: {
    ...makeCtrl(eosbCalcSvc),
    calculate: async (req, res, next) => { try { const d = await eosbCalcSvc.calculate(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d, message: 'EOSB calculated' }); } catch (e) { next(e); } },
  },
  eosbSettleCtrl: {
    ...makeCtrl(eosbSettleSvc),
    settle: async (req, res, next) => { try { const d = await eosbSettleSvc.settle(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d, message: 'Settlement created' }); } catch (e) { next(e); } },
    approve: async (req, res, next) => { try { const d = await eosbSettleSvc.approve(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  },
  wpsCtrl: {
    ...makeCtrl(wpsSvc),
    setDefault: async (req, res, next) => { try { const d = await wpsSvc.setDefault(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
    generateExport: async (req, res, next) => { try { const d = await wpsSvc.generateExport(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  },
  essCtrl: {
    ...makeCtrl(essSvc),
    approve: async (req, res, next) => { try { const d = await essSvc.approve(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
    reject: async (req, res, next) => { try { const d = await essSvc.reject(req.params.id, req.tenantId, req.userId, req.body.remarks); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  },
};
