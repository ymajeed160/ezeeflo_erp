/**
 * Documents API Service
 * Mirrors: /api/hr/employee-documents
 */

import api from '../services/apiClient';
import type { ApiResponse, EmployeeDocument, PaginatedResponse } from '../types';

const DocumentsAPI = {
  getAll: async (params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<EmployeeDocument>> => {
    const response = await api.get('/employee-documents', { params });
    return response.data as PaginatedResponse<EmployeeDocument>;
  },

  getById: async (id: string): Promise<ApiResponse<EmployeeDocument>> => {
    const response = await api.get(`/employee-documents/${id}`);
    return response.data;
  },

  getExpiryAlerts: async (): Promise<ApiResponse<EmployeeDocument[]>> => {
    const response = await api.get('/employee-documents/expiry-alerts');
    return response.data;
  },

  download: async (id: string): Promise<{ url: string }> => {
    const response = await api.get(`/employee-documents/${id}/download`);
    return response.data.data;
  },
};

export default DocumentsAPI;
