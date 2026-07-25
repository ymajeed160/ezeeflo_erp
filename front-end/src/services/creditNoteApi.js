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

class CreditNoteApi {
  /**
   * List credit notes with pagination, search, filter, sort
   */
  static async list(params = {}) {
    const response = await api.get(`/credit-notes`, {
      params: {
        tenantId: TENANT_ID,
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Get credit note by ID
   */
  static async getById(id) {
    const response = await api.get(`/credit-notes/${id}`);
    return response.data;
  }

  /**
   * Create new credit note
   */
  static async create(data) {
    const response = await api.post(`/credit-notes`, {
      tenantId: TENANT_ID,
      ...data,
    });
    return response.data;
  }

  /**
   * Update credit note
   */
  static async update(id, data) {
    const response = await api.put(`/credit-notes/${id}`, data);
    return response.data;
  }

  /**
   * Delete credit note
   */
  static async delete(id) {
    const response = await api.delete(`/credit-notes/${id}`);
    return response.data;
  }

  /**
   * Post credit note (accounting + inventory)
   */
  static async post(id) {
    const response = await api.post(`/credit-notes/${id}/post`);
    return response.data;
  }

  /**
   * Cancel credit note
   */
  static async cancel(id) {
    const response = await api.post(`/credit-notes/${id}/cancel`);
    return response.data;
  }
}

export default CreditNoteApi;