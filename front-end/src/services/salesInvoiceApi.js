import axios from 'axios';
import { getToken, getActiveCompanyId } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';

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
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

class SalesInvoiceApi {
  /**
   * List sales invoices with pagination, search, filter, sort
   */
  static async list(params = {}) {
    const response = await api.get(`/sales-invoices`, {
      params: {
        ...params,
      },
    });
    return response.data;
  }

  /**
   * List posted invoices for payment allocation by customer
   * Returns only invoices with outstanding balance > 0
   */
  static async listForAllocation(customerId, paymentId = null) {
    const params = { customerId };
    if (paymentId) {
      params.paymentId = paymentId;
    }
    const response = await api.get(`/sales-invoices/for-allocation`, { params });
    return response.data;
  }

  /**
   * Get sales invoice by ID
   */
  static async getById(id) {
    const response = await api.get(`/sales-invoices/${id}`);
    return response.data;
  }

  /**
   * Create new sales invoice
   */
  static async create(data) {
    const response = await api.post(`/sales-invoices`, {
      ...data,
    });
    return response.data;
  }

  /**
   * Update sales invoice
   */
  static async update(id, data) {
    const response = await api.put(`/sales-invoices/${id}`, data);
    return response.data;
  }

  /**
   * Delete sales invoice
   */
  static async delete(id) {
    const response = await api.delete(`/sales-invoices/${id}`);
    return response.data;
  }

  /**
   * Post invoice (accounting + inventory integration)
   */
  static async post(id, data = {}) {
    const response = await api.post(`/sales-invoices/${id}/post`, data);
    return response.data;
  }

  /**
   * Cancel invoice
   */
  static async cancel(id) {
    const response = await api.post(`/sales-invoices/${id}/cancel`);
    return response.data;
  }

  /**
   * Generate invoice from Sales Order
   */
  static async generateFromSalesOrder(salesOrderId) {
    const response = await api.post(`/sales-invoices/from-sales-order/${salesOrderId}`);
    return response.data;
  }

  /**
   * Generate invoice from Delivery Note
   */
  static async generateFromDeliveryNote(deliveryNoteId) {
    const response = await api.post(`/sales-invoices/from-delivery-note/${deliveryNoteId}`);
    return response.data;
  }

  /**
   * Send invoice via email with PDF attachment
   */
  static async sendEmail(id, { to, subject, body, pdfBase64 }) {
    const response = await api.post(`/sales-invoices/${id}/send-email`, { to, subject, body, pdfBase64 });
    return response.data;
  }
}

export default SalesInvoiceApi;