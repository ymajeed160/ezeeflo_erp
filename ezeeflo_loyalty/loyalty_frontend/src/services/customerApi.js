import api from '../utils/api';

const customerApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  toggleStatus: (id) => api.patch(`/customers/${id}/toggle-status`),
  merge: (data) => api.post('/customers/merge', data),
  getSegments: () => api.get('/customers/segments'),
  getTags: () => api.get('/customers/tags'),
  getWallet: (id) => api.get(`/customers/${id}/wallet`),
};

export default customerApi;
