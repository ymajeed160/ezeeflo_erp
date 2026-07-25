import api from './api';

const purchaseRequestApi = {
  getAll: (params = {}) => api.get('/purchase-requests', { params }),
  getById: (id) => api.get(`/purchase-requests/${id}`),
  create: (data) => api.post('/purchase-requests', data),
  update: (id, data) => api.put(`/purchase-requests/${id}`, data),
  delete: (id) => api.delete(`/purchase-requests/${id}`),
  updateStatus: (id, data) => api.patch(`/purchase-requests/${id}/status`, data),
  submit: (id) => api.patch(`/purchase-requests/${id}/submit`),
  approve: (id) => api.patch(`/purchase-requests/${id}/approve`),
  reject: (id) => api.patch(`/purchase-requests/${id}/reject`),
};

export default purchaseRequestApi;