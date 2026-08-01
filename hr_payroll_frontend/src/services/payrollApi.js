import hrApi from './hrApi';

const PayrollApi = {
  // Salary Structures
  salaryStructures: { list: (p) => hrApi.get('/salary-structures', { params: p }), create: (d) => hrApi.post('/salary-structures', d), update: (id, d) => hrApi.put(`/salary-structures/${id}`, d), delete: (id) => hrApi.delete(`/salary-structures/${id}`) },
  // Salary Components
  salaryComponents: { list: (p) => hrApi.get('/salary-components', { params: p }), create: (d) => hrApi.post('/salary-components', d), update: (id, d) => hrApi.put(`/salary-components/${id}`, d), delete: (id) => hrApi.delete(`/salary-components/${id}`) },
  // Employee Salaries
  employeeSalaries: { list: (p) => hrApi.get('/employee-salaries', { params: p }), create: (d) => hrApi.post('/employee-salaries', d), update: (id, d) => hrApi.put(`/employee-salaries/${id}`, d), delete: (id) => hrApi.delete(`/employee-salaries/${id}`) },
  // Allowance Types
  allowanceTypes: { list: (p) => hrApi.get('/allowance-types', { params: p }), create: (d) => hrApi.post('/allowance-types', d), update: (id, d) => hrApi.put(`/allowance-types/${id}`, d), delete: (id) => hrApi.delete(`/allowance-types/${id}`) },
  // Employee Allowances
  employeeAllowances: { list: (p) => hrApi.get('/employee-allowances', { params: p }), create: (d) => hrApi.post('/employee-allowances', d), update: (id, d) => hrApi.put(`/employee-allowances/${id}`, d), delete: (id) => hrApi.delete(`/employee-allowances/${id}`) },
  // Deduction Types
  deductionTypes: { list: (p) => hrApi.get('/deduction-types', { params: p }), create: (d) => hrApi.post('/deduction-types', d), update: (id, d) => hrApi.put(`/deduction-types/${id}`, d), delete: (id) => hrApi.delete(`/deduction-types/${id}`) },
  // Employee Deductions
  employeeDeductions: { list: (p) => hrApi.get('/employee-deductions', { params: p }), create: (d) => hrApi.post('/employee-deductions', d), update: (id, d) => hrApi.put(`/employee-deductions/${id}`, d), delete: (id) => hrApi.delete(`/employee-deductions/${id}`) },
  // Employee Loans
  employeeLoans: { list: (p) => hrApi.get('/employee-loans', { params: p }), create: (d) => hrApi.post('/employee-loans', d), update: (id, d) => hrApi.put(`/employee-loans/${id}`, d), delete: (id) => hrApi.delete(`/employee-loans/${id}`) },
  // Loan Repayments
  loanRepayments: { list: (p) => hrApi.get('/loan-repayments', { params: p }) },
  // Payroll Periods
  payrollPeriods: { list: (p) => hrApi.get('/payroll-periods', { params: p }), create: (d) => hrApi.post('/payroll-periods', d), update: (id, d) => hrApi.put(`/payroll-periods/${id}`, d), delete: (id) => hrApi.delete(`/payroll-periods/${id}`) },
  // Payroll Runs
  payrollRuns: {
    list: (p) => hrApi.get('/payroll-runs', { params: p }),
    process: (periodId) => hrApi.post('/payroll-runs/process', { periodId }),
    approve: (id) => hrApi.post(`/payroll-runs/${id}/approve`),
    reverse: (id) => hrApi.post(`/payroll-runs/${id}/reverse`),
    delete: (id) => hrApi.delete(`/payroll-runs/${id}`),
  },
  // Payroll Details
  payrollDetails: { list: (p) => hrApi.get('/payroll-details', { params: p }) },
  // Payslips
  payslips: { list: (p) => hrApi.get('/payslips', { params: p }), delete: (id) => hrApi.delete(`/payslips/${id}`) },
};

export default PayrollApi;
