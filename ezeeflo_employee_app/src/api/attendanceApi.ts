/**
 * Attendance API Service
 * 
 * Mirrors existing HR backend routes:
 * - /api/hr/attendance, /api/hr/shifts, /api/hr/shift-assignments
 */

import api from '../services/apiClient';
import type {
  ApiResponse,
  AttendanceRecord,
  TodayAttendance,
  AttendanceSummary,
  GeoLocation,
  Shift,
  PaginatedResponse,
} from '../types';

const AttendanceAPI = {
  /**
   * Mark attendance (check-in/check-out)
   * Backend expects: employeeId, attendanceDate, checkInTime | checkOutTime, method
   */
  mark: async (data: {
    employeeId: string;
    attendanceDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    method?: string;
    remarks?: string;
    location?: GeoLocation;
  }): Promise<ApiResponse<AttendanceRecord>> => {
    const payload: any = {
      employeeId: data.employeeId,
      attendanceDate: data.attendanceDate,
      method: data.method || 'Mobile',
    };
    if (data.checkInTime) payload.checkInTime = data.checkInTime;
    if (data.checkOutTime) payload.checkOutTime = data.checkOutTime;
    if (data.remarks) payload.remarks = data.remarks;
    const response = await api.post('/attendance/mark', payload);
    return response.data;
  },

  /**
   * Get today's attendance summary (per-employee if employeeId provided)
   */
  getTodaySummary: async (employeeId?: string): Promise<ApiResponse<TodayAttendance>> => {
    const response = await api.get('/attendance/today-summary', {
      params: employeeId ? { employeeId } : undefined,
    });
    return response.data;
  },

  /**
   * Get attendance records (paginated)
   */
  getRecords: async (params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
  }): Promise<PaginatedResponse<AttendanceRecord>> => {
    const response = await api.get('/attendance', { params });
    return response.data as PaginatedResponse<AttendanceRecord>;
  },

  /**
   * Get single attendance record
   */
  getById: async (id: string): Promise<ApiResponse<AttendanceRecord>> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  /**
   * Get monthly attendance summary
   */
  getMonthlySummary: async (year: number, month: number): Promise<ApiResponse<AttendanceSummary>> => {
    const response = await api.get('/attendance/monthly-summary', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Get attendance calendar data for a month
   */
  getCalendar: async (year: number, month: number): Promise<ApiResponse<Record<string, AttendanceRecord>>> => {
    const response = await api.get('/attendance/calendar', {
      params: { year, month },
    });
    return response.data;
  },

  /**
   * Request attendance correction
   */
  requestCorrection: async (data: {
    attendanceId: string;
    correctionType: 'check_in' | 'check_out';
    requestedTime: string;
    reason: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/attendance/correction', data);
    return response.data;
  },

  /**
   * Get assigned shift
   */
  getMyShift: async (): Promise<ApiResponse<Shift>> => {
    const response = await api.get('/shifts/my-shift');
    return response.data;
  },

  /**
   * Get overtime entries
   */
  getOvertime: async (params?: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/overtime', { params });
    return response.data as PaginatedResponse<any>;
  },

  /**
   * Validate GPS location against geofence
   */
  validateLocation: async (location: GeoLocation): Promise<ApiResponse<{
    isValid: boolean;
    nearestArea?: string;
    distance?: number;
  }>> => {
    const response = await api.post('/attendance/validate-location', location);
    return response.data;
  },

  /**
   * Sync offline attendance records
   */
  syncOffline: async (records: Array<{
    action: string;
    timestamp: string;
    location?: GeoLocation;
    remarks?: string;
  }>): Promise<ApiResponse<{ synced: number; failed: number }>> => {
    const response = await api.post('/attendance/sync-offline', { records });
    return response.data;
  },
};

export default AttendanceAPI;
