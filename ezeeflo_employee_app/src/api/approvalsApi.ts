/**
 * Approvals API Service (Manager features)
 */

import api from '../services/apiClient';
import type { ApiResponse, PendingApproval, PaginatedResponse } from '../types';

const ApprovalsAPI = {
  getPending: async (params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<PendingApproval>> => {
    const response = await api.get('/approvals/pending', { params });
    return response.data as PaginatedResponse<PendingApproval>;
  },

  approve: async (type: string, id: string, comments?: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/approvals/${type}/${id}/approve`, { comments });
    return response.data;
  },

  reject: async (type: string, id: string, comments?: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/approvals/${type}/${id}/reject`, { comments });
    return response.data;
  },

  getCount: async (): Promise<ApiResponse<{ total: number }>> => {
    const response = await api.get('/approvals/pending-count');
    return response.data;
  },
};

export default ApprovalsAPI;
