/**
 * Dashboard API Service
 * 
 * Mirrors: GET /api/hr/dashboard/summary
 */

import api from '../services/apiClient';
import type { ApiResponse, DashboardData } from '../types';

const DashboardAPI = {
  /**
   * Get dashboard summary with all employee-specific data
   */
  getSummary: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays: async (limit: number = 5): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/holidays', {
      params: { limit, sort: 'date', order: 'ASC' },
    });
    return response.data;
  },

  /**
   * Get latest announcements
   */
  getAnnouncements: async (limit: number = 5): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/announcements', {
      params: { limit },
    });
    return response.data;
  },
};

export default DashboardAPI;
