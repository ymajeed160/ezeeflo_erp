import apiClient from './apiClient';

const resource = '/api/purchase-orders';

export default {
  getAll(params = {}) {
    return apiClient.get(resource, { params });
  },
  getById(id) {
    return apiClient.get(`${resource}/${id}`);
  },
  create(data) {
    return apiClient.post(resource, data);
  },
  generateFromPR(data) {
    return apiClient.post(`${resource}/generate-from-pr`, data);
  },
  update(id, data) {
    return apiClient.put(`${resource}/${id}`, data);
  },
  delete(id) {
    return apiClient.delete(`${resource}/${id}`);
  },
  approve(id, data) {
    return apiClient.put(`${resource}/${id}/approve`, data);
  },
  getOutstanding(params = {}) {
    return apiClient.get(`${resource}/outstanding`, { params });
  },
  sendEmail(id, { to, subject, body, pdfBase64 }) {
    return apiClient.post(`${resource}/${id}/send-email`, { to, subject, body, pdfBase64 });
  },
};