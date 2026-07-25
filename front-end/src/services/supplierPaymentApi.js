import api from './api';

const supplierPaymentApi = {
  getAll: (params) => api.get('/supplier-payments', { params }),
  getById: (id) => api.get(`/supplier-payments/${id}`),
  create: (data) => api.post('/supplier-payments', data),
  update: (id, data) => api.put(`/supplier-payments/${id}`, data),
  delete: (id) => api.delete(`/supplier-payments/${id}`),
  approve: (id) => api.post(`/supplier-payments/${id}/approve`),
  confirm: (id) => api.post(`/supplier-payments/${id}/confirm`),
  postToJournal: (id) => api.post(`/supplier-payments/${id}/post-to-journal`),
};

export default supplierPaymentApi;