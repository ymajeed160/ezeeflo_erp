import api from './api';

const supplierPaymentApi = {
  getAll: (params) => api.get('/supplier-payments', { params }),
  getById: (id) => api.get(`/supplier-payments/${id}`),
  create: (data) => api.post('/supplier-payments', data),
  update: (id, data) => api.put(`/supplier-payments/${id}`, data),
  delete: (id, reason) => api.delete(`/supplier-payments/${id}`, { data: { reason } }),
  restore: (id) => api.post(`/supplier-payments/${id}/restore`),
  cancel: (id, reason) => api.post(`/supplier-payments/${id}/cancel`, { reason }),
  approve: (id) => api.post(`/supplier-payments/${id}/approve`),
  confirm: (id) => api.post(`/supplier-payments/${id}/confirm`),
  postToJournal: (id, data = {}) => api.post(`/supplier-payments/${id}/post-to-journal`, data),
  getPostingPreview: (id) => api.get(`/supplier-payments/${id}/posting-preview`),
  reverse: (id) => api.post(`/supplier-payments/${id}/reverse`),
};

export default supplierPaymentApi;