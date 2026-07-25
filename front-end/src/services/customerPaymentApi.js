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

class CustomerPaymentApi {
  /**
   * List customer payments with pagination, search, filter, sort
   */
  static async list(params = {}) {
    const response = await api.get(`/customer-payments`, {
      params: {
        tenantId: TENANT_ID,
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Get customer payment by ID
   */
  static async getById(id) {
    const response = await api.get(`/customer-payments/${id}`, {
      params: { tenantId: TENANT_ID },
    });
    return response.data;
  }

  /**
   * Create customer payment
   */
  static async create(data) {
    const response = await api.post('/customer-payments', data, {
      params: { tenantId: TENANT_ID },
    });
    return response.data;
  }

  /**
   * Update customer payment
   */
  static async update(id, data) {
    const response = await api.put(`/customer-payments/${id}`, data, {
      params: { tenantId: TENANT_ID },
    });
    return response.data;
  }

  /**
   * Delete customer payment
   */
  static async delete(id) {
    const response = await api.delete(`/customer-payments/${id}`, {
      params: { tenantId: TENANT_ID },
    });
    return response.data;
  }

  /**
   * Post customer payment (accounting) with account selection
   */
  static async post(id, data = {}) {
    const response = await api.post(`/customer-payments/${id}/post`, data);
    return response.data;
  }

  /**
   * Cancel customer payment
   */
  static async cancel(id) {
    const response = await api.post(`/customer-payments/${id}/cancel`, {});
    return response.data;
  }
}

export default CustomerPaymentApi;