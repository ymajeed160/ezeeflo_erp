/**
 * Assets API Service
 */

import api from '../services/apiClient';
import type { ApiResponse, EmployeeAsset } from '../types';

const AssetsAPI = {
  getMyAssets: async (): Promise<ApiResponse<EmployeeAsset[]>> => {
    const response = await api.get('/employee-assets/me');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EmployeeAsset>> => {
    const response = await api.get(`/employee-assets/${id}`);
    return response.data;
  },

  reportLost: async (assetId: string, remarks?: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/employee-assets/${assetId}/report-lost`, { remarks });
    return response.data;
  },

  requestReturn: async (assetId: string, remarks?: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/employee-assets/${assetId}/request-return`, { remarks });
    return response.data;
  },
};

export default AssetsAPI;
