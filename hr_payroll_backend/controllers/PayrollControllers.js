const {
  salaryStructureSvc, salaryComponentSvc, employeeSalarySvc,
  allowanceTypeSvc, empAllowanceSvc, deductionTypeSvc, empDeductionSvc,
  employeeLoanSvc, loanRepaymentSvc,
  payrollPeriodSvc, payrollRunSvc, payrollDetailSvc, payslipSvc,
  processPayroll, approvePayroll, reversePayroll, processExistingRun,
} = require('../services/PayrollServices');
const ApiResponse = require('../utils/apiResponse');

const makeCtrl = (svc) => ({
  getAll: async (req, res, next) => { try { const r = await svc.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await svc.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await svc.create(req.body, req.tenantId, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await svc.update(req.params.id, req.body, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { const r = await svc.delete(req.params.id, req.tenantId); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } },
});

module.exports = {
  salaryStructureCtrl: makeCtrl(salaryStructureSvc),
  salaryComponentCtrl: makeCtrl(salaryComponentSvc),
  employeeSalaryCtrl: makeCtrl(employeeSalarySvc),
  allowanceTypeCtrl: makeCtrl(allowanceTypeSvc),
  empAllowanceCtrl: makeCtrl(empAllowanceSvc),
  deductionTypeCtrl: makeCtrl(deductionTypeSvc),
  empDeductionCtrl: makeCtrl(empDeductionSvc),
  employeeLoanCtrl: makeCtrl(employeeLoanSvc),
  loanRepaymentCtrl: makeCtrl(loanRepaymentSvc),
  payrollPeriodCtrl: makeCtrl(payrollPeriodSvc),
  payrollRunCtrl: makeCtrl(payrollRunSvc),
  payrollDetailCtrl: makeCtrl(payrollDetailSvc),
  payslipCtrl: makeCtrl(payslipSvc),
  payrollProcessCtrl: async (req, res, next) => { try { const d = await processPayroll(req.body.periodId, req.tenantId, req.userId); return ApiResponse.created(res, { data: d, message: 'Payroll processed successfully' }); } catch (e) { next(e); } },
  payrollApproveCtrl: async (req, res, next) => { try { const d = await approvePayroll(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Payroll approved' }); } catch (e) { next(e); } },
  payrollReverseCtrl: async (req, res, next) => { try { const d = await reversePayroll(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },

  // Loan Approval
  loanApproveCtrl: async (req, res, next) => { try { const d = await employeeLoanSvc.approve(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Loan approved' }); } catch (e) { next(e); } },
  loanRejectCtrl: async (req, res, next) => { try { const d = await employeeLoanSvc.reject(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Loan rejected' }); } catch (e) { next(e); } },
  loanActivateCtrl: async (req, res, next) => { try { const d = await employeeLoanSvc.activate(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Loan activated' }); } catch (e) { next(e); } },
  payrollProcessExistingCtrl: async (req, res, next) => { try { const d = await processExistingRun(req.params.id, req.tenantId, req.userId); return ApiResponse.success(res, { data: d, message: 'Payroll run processed' }); } catch (e) { next(e); } },
};
