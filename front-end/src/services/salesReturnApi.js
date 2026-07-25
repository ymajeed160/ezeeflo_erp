import axios from 'axios';
import { getToken, getActiveCompanyId } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const TENANT_ID = localStorage.getItem('tenantId') || 1;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token and active company to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const companyId = getActiveCompanyId();
  if (companyId) {
    config.headers['X-Company-Id'] = companyId;
  }
  return config;
});

// Response interceptor - redirect to login on token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('persist:root');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class SalesReturnApi {
  /**
   * List sales returns with pagination, search, filter, sort
   */
  static async list(params = {}) {
    const response = await api.get(`/sales-returns`, { params });
    return response.data;
  }

  /**
   * Get sales return by ID
   */
  static async getById(id) {
    const response = await api.get(`/sales-returns/${id}`);
    return response.data;
  }

  /**
   * Create new sales return
   */
  static async create(data) {
    const response = await api.post(`/sales-returns`, data);
    return response.data;
  }

  /**
   * Update sales return
   */
  static async update(id, data) {
    const response = await api.put(`/sales-returns/${id}`, data);
    return response.data;
  }

  /**
   * Delete sales return
   */
  static async delete(id) {
    const response = await api.delete(`/sales-returns/${id}`);
    return response.data;
  }

  /**
   * Post return (accounting + inventory integration with account selection)
   */
  static async post(id, data = {}) {
    const response = await api.post(`/sales-returns/${id}/post`, data);
    return response.data;
  }

  /**
   * Approve return (accounting + inventory integration)
   */
  static async approve(id) {
    const response = await api.post(`/sales-returns/${id}/approve`);
    return response.data;
  }

  /**
   * Reject return
   */
  static async reject(id) {
    const response = await api.post(`/sales-returns/${id}/reject`);
    return response.data;
  }
}

export default SalesReturnApi;