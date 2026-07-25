import api from './api';

const debitNoteApi = {
  getAll: (params) => api.get('/debit-notes', { params }),
  getById: (id) => api.get(`/debit-notes/${id}`),
  create: (data) => api.post('/debit-notes', data),
  update: (id, data) => api.put(`/debit-notes/${id}`, data),
  delete: (id) => api.delete(`/debit-notes/${id}`),
  approve: (id) => api.post(`/debit-notes/${id}/approve`),
};

export default debitNoteApi;