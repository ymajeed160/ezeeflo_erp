import PayrollApi from '../../services/payrollApi';
import { createOrgSlice } from './orgSliceFactory';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const {
  slice: salStructSlice, fetchAll: fetchSalStructures, create: createSalStructure,
  update: updateSalStructure, remove: deleteSalStructure,
} = createOrgSlice('salStructures', PayrollApi.salaryStructures);

export const {
  slice: salCompSlice, fetchAll: fetchSalComponents, create: createSalComponent,
  update: updateSalComponent, remove: deleteSalComponent,
} = createOrgSlice('salComponents', PayrollApi.salaryComponents);

export const {
  slice: empSalSlice, fetchAll: fetchEmpSalaries, create: createEmpSalary,
  update: updateEmpSalary, remove: deleteEmpSalary,
} = createOrgSlice('empSalaries', PayrollApi.employeeSalaries);

export const {
  slice: allowTypeSlice, fetchAll: fetchAllowTypes, create: createAllowType,
  update: updateAllowType, remove: deleteAllowType,
} = createOrgSlice('allowTypes', PayrollApi.allowanceTypes);

export const {
  slice: empAllowSlice, fetchAll: fetchEmpAllowances, create: createEmpAllowance,
  update: updateEmpAllowance, remove: deleteEmpAllowance,
} = createOrgSlice('empAllowances', PayrollApi.employeeAllowances);

export const {
  slice: dedTypeSlice, fetchAll: fetchDedTypes, create: createDedType,
  update: updateDedType, remove: deleteDedType,
} = createOrgSlice('dedTypes', PayrollApi.deductionTypes);

export const {
  slice: empDedSlice, fetchAll: fetchEmpDeductions, create: createEmpDeduction,
  update: updateEmpDeduction, remove: deleteEmpDeduction,
} = createOrgSlice('empDeductions', PayrollApi.employeeDeductions);

export const {
  slice: loanSlice, fetchAll: fetchLoans, create: createLoan,
  update: updateLoan, remove: deleteLoan,
} = createOrgSlice('loans', PayrollApi.employeeLoans);

export const {
  slice: periodSlice, fetchAll: fetchPeriods, create: createPeriod,
  update: updatePeriod, remove: deletePeriod,
} = createOrgSlice('periods', PayrollApi.payrollPeriods);

export const {
  slice: runSlice, fetchAll: fetchRuns, create: createRun,
  update: updateRun, remove: deleteRun,
} = createOrgSlice('runs', {
  list: PayrollApi.payrollRuns.list, create: PayrollApi.payrollRuns.list,
  update: PayrollApi.payrollRuns.list, delete: PayrollApi.payrollRuns.list,
});

export const {
  slice: detailSlice, fetchAll: fetchDetails,
} = createOrgSlice('details', PayrollApi.payrollDetails);

export const {
  slice: payslipSlice, fetchAll: fetchPayslips,
} = createOrgSlice('payslips', PayrollApi.payslips);

// Payroll run process thunk
export const processPayrollRun = createAsyncThunk('runs/process', async (periodId, { rejectWithValue }) => {
  try { const res = await PayrollApi.payrollRuns.process(periodId); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to process payroll'); }
});

export const payrollReducers = {
  salStructures: salStructSlice.reducer, salComponents: salCompSlice.reducer,
  empSalaries: empSalSlice.reducer, allowTypes: allowTypeSlice.reducer,
  empAllowances: empAllowSlice.reducer, dedTypes: dedTypeSlice.reducer,
  empDeductions: empDedSlice.reducer, loans: loanSlice.reducer,
  periods: periodSlice.reducer, runs: runSlice.reducer,
  details: detailSlice.reducer, payslips: payslipSlice.reducer,
};
