/**
 * Payroll API Service
 * 
 * Mirrors existing HR backend routes:
 * - /api/hr/payslips, /api/hr/employee-salaries, /api/hr/employee-loans
 */

import api from '../services/apiClient';
import type {
  ApiResponse,
  Payslip,
  PayslipDetail,
  SalaryBreakdown,
  EmployeeLoan,
  EosbSummary,
  PaginatedResponse,
} from '../types';

const PayrollAPI = {
  /**
   * Get payslips (paginated)
   */
  getPayslips: async (params?: {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
    employeeId?: string;
  }): Promise<PaginatedResponse<Payslip>> => {
    const response = await api.get('/payslips', { params });
    return response.data as PaginatedResponse<Payslip>;
  },

  /**
   * Get single payslip with details
   */
  getPayslipById: async (id: string): Promise<ApiResponse<Payslip & { details: PayslipDetail[] }>> => {
    const response = await api.get(`/payslips/${id}`);
    return response.data;
  },

  /**
   * Download payslip as PDF
   */
  downloadPayslip: async (id: string): Promise<{ url: string }> => {
    const response = await api.get(`/payslips/${id}/download`);
    return response.data.data;
  },

  /**
   * Get salary breakdown
   */
  getSalaryBreakdown: async (employeeId?: string): Promise<ApiResponse<SalaryBreakdown>> => {
    const params: any = { limit: 1 };
    if (employeeId) params.employeeId = employeeId;
    const response = await api.get('/employee-salaries', { params });
    // Backend returns paginated, extract first item
    const res = response.data as any;
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      res.data = res.data[0];
    }
    return res;
  },

  /**
   * Get payroll history summary
   */
  getPayrollHistory: async (params?: {
    year?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/payslips/history', { params });
    return response.data;
  },

  /**
   * Get employee loans
   */
  getLoans: async (): Promise<ApiResponse<EmployeeLoan[]>> => {
    const response = await api.get('/employee-loans');
    return response.data;
  },

  /**
   * Get loan repayment schedule
   */
  getLoanRepayments: async (loanId: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/loan-repayments`, {
      params: { loanId },
    });
    return response.data;
  },

  /**
   * Get EOSB summary
   */
  getEosbSummary: async (): Promise<ApiResponse<EosbSummary>> => {
    const response = await api.get('/eosb/summary');
    return response.data;
  },

  /**
   * Get employee allowances
   */
  getEmployeeAllowances: async (employeeId?: string): Promise<ApiResponse<any[]>> => {
    const params: any = {};
    if (employeeId) params.employeeId = employeeId;
    const response = await api.get('/employee-allowances', { params });
    const res = response.data as any;
    if (res.success && Array.isArray(res.data)) return res;
    return { success: true, data: [] as any[] };
  },

  /**
   * Get employee deductions
   */
  getEmployeeDeductions: async (employeeId?: string): Promise<ApiResponse<any[]>> => {
    const params: any = {};
    if (employeeId) params.employeeId = employeeId;
    const response = await api.get('/employee-deductions', { params });
    const res = response.data as any;
    if (res.success && Array.isArray(res.data)) return res;
    return { success: true, data: [] as any[] };
  },

  /**
   * Get bonus history
   */
  getBonusHistory: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/employee-salaries/bonus-history');
    return response.data;
  },
};

export default PayrollAPI;
