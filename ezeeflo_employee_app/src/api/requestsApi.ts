/**
 * Requests API Service
 * Mirrors: /api/hr/ess-requests, /api/hr/ess-submissions
 */

import api from '../services/apiClient';
import type { ApiResponse, DocumentRequest, PaginatedResponse } from '../types';

const RequestsAPI = {
  getRequests: async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<DocumentRequest>> => {
    const response = await api.get('/ess-submissions', { params });
    return response.data as PaginatedResponse<DocumentRequest>;
  },

  getById: async (id: string): Promise<ApiResponse<DocumentRequest>> => {
    const response = await api.get(`/ess-submissions/${id}`);
    return response.data;
  },

  submit: async (data: { requestType: string; purpose?: string; deliveryMethod?: string; comments?: string }): Promise<ApiResponse<DocumentRequest>> => {
    const response = await api.post('/ess-submissions', data);
    return response.data;
  },

  cancel: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/ess-submissions/${id}/cancel`);
    return response.data;
  },

  download: async (id: string): Promise<{ url: string }> => {
    const response = await api.get(`/ess-submissions/${id}/download`);
    return response.data.data;
  },
};

export default RequestsAPI;
