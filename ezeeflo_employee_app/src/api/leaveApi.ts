/**
 * Leave API Service
 * 
 * Mirrors existing HR backend routes:
 * - /api/hr/leave-types, /api/hr/leave-applications, 
 * - /api/hr/leave-balances, /api/hr/holidays
 */

import api from '../services/apiClient';
import type {
  ApiResponse,
  LeaveType,
  LeaveBalance,
  LeaveApplication,
  Holiday,
  PaginatedResponse,
} from '../types';

const LeaveAPI = {
  /**
   * Get all leave types
   */
  getLeaveTypes: async (): Promise<ApiResponse<LeaveType[]>> => {
    const response = await api.get('/leave-types');
    return response.data;
  },

  /**
   * Get employee leave balances (filtered by employeeId)
   */
  getBalances: async (employeeId?: string): Promise<ApiResponse<LeaveBalance[]>> => {
    const params: any = {};
    if (employeeId) params.employeeId = employeeId;
    const response = await api.get('/leave-balances', { params });
    return response.data;
  },

  /**
   * Get leave applications (paginated)
   */
  getApplications: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedResponse<LeaveApplication>> => {
    const response = await api.get('/leave-applications', { params });
    return response.data as PaginatedResponse<LeaveApplication>;
  },

  /**
   * Get single leave application
   */
  getApplicationById: async (id: string): Promise<ApiResponse<LeaveApplication>> => {
    const response = await api.get(`/leave-applications/${id}`);
    return response.data;
  },

  /**
   * Apply for leave
   */
  apply: async (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    attachmentUrl?: string;
  }): Promise<ApiResponse<LeaveApplication>> => {
    const response = await api.post('/leave-applications', data);
    return response.data;
  },

  /**
   * Cancel a leave application
   */
  cancel: async (id: string): Promise<ApiResponse<LeaveApplication>> => {
    const response = await api.post(`/leave-applications/${id}/cancel`);
    return response.data;
  },

  /**
   * Get leave summary (pending, approved, rejected counts)
   */
  getSummary: async (): Promise<ApiResponse<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>> => {
    const response = await api.get('/leave-applications/summary');
    return response.data;
  },

  /**
   * Get holidays
   */
  getHolidays: async (params?: {
    year?: number;
    limit?: number;
  }): Promise<ApiResponse<Holiday[]>> => {
    const response = await api.get('/holidays', { params });
    return response.data;
  },

  /**
   * Get leave calendar data (leave + holidays for a month)
   */
  getCalendar: async (year: number, month: number): Promise<ApiResponse<any>> => {
    const response = await api.get('/leave-applications/calendar', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Upload attachment for leave
   */
  uploadAttachment: async (leaveId: string, formData: FormData): Promise<ApiResponse<{ url: string }>> => {
    const response = await api.upload(
      `/leave-applications/${leaveId}/attachment`,
      formData
    );
    return response.data;
  },
};

export default LeaveAPI;
