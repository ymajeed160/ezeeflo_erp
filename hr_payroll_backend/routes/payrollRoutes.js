/**
 * @swagger
 * /api/hr/salary-structures:
 *   get:
 *     tags: [Payroll]
 *     summary: List salary structures
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create salary structure
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/salary-components:
 *   get:
 *     tags: [Payroll]
 *     summary: List salary components
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create salary component
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/employee-salaries:
 *   get:
 *     tags: [Payroll]
 *     summary: List employee salaries
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create employee salary
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/allowance-types:
 *   get:
 *     tags: [Payroll]
 *     summary: List allowance types
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create allowance type
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/employee-allowances:
 *   get:
 *     tags: [Payroll]
 *     summary: List employee allowances
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create employee allowance
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/deduction-types:
 *   get:
 *     tags: [Payroll]
 *     summary: List deduction types
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create deduction type
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/employee-deductions:
 *   get:
 *     tags: [Payroll]
 *     summary: List employee deductions
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create employee deduction
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/employee-loans:
 *   get:
 *     tags: [Payroll]
 *     summary: List employee loans
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create employee loan
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/loan-repayments:
 *   get:
 *     tags: [Payroll]
 *     summary: List loan repayments
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create loan repayment
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/payroll-periods:
 *   get:
 *     tags: [Payroll]
 *     summary: List payroll periods
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create payroll period
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/payroll-runs:
 *   get:
 *     tags: [Payroll]
 *     summary: List payroll runs
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create payroll run
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/payroll-runs/process:
 *   post:
 *     tags: [Payroll]
 *     summary: Process payroll
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Processing } }
 * /api/hr/payroll-runs/{id}/approve:
 *   post:
 *     tags: [Payroll]
 *     summary: Approve payroll run
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Approved } }
 * /api/hr/payroll-runs/{id}/reverse:
 *   post:
 *     tags: [Payroll]
 *     summary: Reverse payroll run
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses: { 200: { description: Reversed } }
 * /api/hr/payroll-details:
 *   get:
 *     tags: [Payroll]
 *     summary: List payroll details
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create payroll detail
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 * /api/hr/payslips:
 *   get:
 *     tags: [Payroll]
 *     summary: List payslips
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Success } }
 *   post:
 *     tags: [Payroll]
 *     summary: Create payslip
 *     security: [{ bearerAuth: [] }]
 *     responses: { 201: { description: Created } }
 */
const express = require('express');
const {
  salaryStructureCtrl, salaryComponentCtrl, employeeSalaryCtrl,
  allowanceTypeCtrl, empAllowanceCtrl, deductionTypeCtrl, empDeductionCtrl,
  employeeLoanCtrl, loanRepaymentCtrl, loanApproveCtrl, loanRejectCtrl, loanActivateCtrl,
  payrollProcessExistingCtrl,
  payrollPeriodCtrl, payrollRunCtrl, payrollDetailCtrl, payslipCtrl,
  payrollProcessCtrl, payrollApproveCtrl, payrollReverseCtrl,
} = require('../controllers/PayrollControllers');

const r = (ctrl) => {
  const router = express.Router();
  router.get('/', ctrl.getAll);
  router.post('/', ctrl.create);
  router.get('/:id', ctrl.getById);
  router.put('/:id', ctrl.update);
  router.delete('/:id', ctrl.delete);
  return router;
};

// Payroll Process special routes
const payrollRunRoute = r(payrollRunCtrl);
payrollRunRoute.post('/process', payrollProcessCtrl);
payrollRunRoute.post('/:id/approve', payrollApproveCtrl);
payrollRunRoute.post('/:id/reverse', payrollReverseCtrl);

const employeeLoanRoute = r(employeeLoanCtrl);
employeeLoanRoute.post('/:id/approve', loanApproveCtrl);
employeeLoanRoute.post('/:id/reject', loanRejectCtrl);
employeeLoanRoute.post('/:id/activate', loanActivateCtrl);

module.exports = {
  salaryStructureRoutes: r(salaryStructureCtrl),
  salaryComponentRoutes: r(salaryComponentCtrl),
  employeeSalaryRoutes: r(employeeSalaryCtrl),
  allowanceTypeRoutes: r(allowanceTypeCtrl),
  empAllowanceRoutes: r(empAllowanceCtrl),
  deductionTypeRoutes: r(deductionTypeCtrl),
  empDeductionRoutes: r(empDeductionCtrl),
  employeeLoanRoutes: employeeLoanRoute,
  loanRepaymentRoutes: r(loanRepaymentCtrl),
  payrollPeriodRoutes: r(payrollPeriodCtrl),
  payrollRunRoutes: payrollRunRoute,
  payrollDetailRoutes: r(payrollDetailCtrl),
  payslipRoutes: r(payslipCtrl),
};
