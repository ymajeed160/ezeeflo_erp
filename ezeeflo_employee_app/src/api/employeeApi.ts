/**
 * Employee API Service
 * 
 * Mirrors existing HR backend routes:
 * - GET /api/hr/employees
 */

import api from '../services/apiClient';
import type { ApiResponse, Employee, PaginatedResponse } from '../types';

const EmployeeAPI = {
  /**
   * Get all employees (paginated)
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
  }): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get('/employees', { params });
    return response.data as PaginatedResponse<Employee>;
  },

  /**
   * Get employee by ID
   */
  getById: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Get current employee's profile
   */
  getMyProfile: async (): Promise<ApiResponse<Employee>> => {
    const response = await api.get('/employees/me');
    return response.data;
  },

  /**
   * Update current employee's profile
   */
  updateMyProfile: async (data: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    const response = await api.put('/employees/me', data);
    return response.data;
  },

  /**
   * Get company directory (for org chart / directory)
   */
  getDirectory: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
  }): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get('/employees/directory', { params });
    return response.data as PaginatedResponse<Employee>;
  },
};

export default EmployeeAPI;
