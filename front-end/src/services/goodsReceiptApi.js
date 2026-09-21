import api from './api';

const goodsReceiptApi = {
  list: (params) => api.get('/goods-receipts', { params }),
  getById: (id) => api.get(`/goods-receipts/${id}`),
  create: (data) => api.post('/goods-receipts', data),
  update: (id, data) => api.put(`/goods-receipts/${id}`, data),
  delete: (id, reason) => api.delete(`/goods-receipts/${id}`, { data: { reason } }),
  restore: (id) => api.post(`/goods-receipts/${id}/restore`),
  approve: (id) => api.patch(`/goods-receipts/${id}/approve`),
  cancel: (id, reason) => api.patch(`/goods-receipts/${id}/cancel`, { reason }),
  sendEmail: (id, { to, subject, body, pdfBase64 }) => api.post(`/goods-receipts/${id}/send-email`, { to, subject, body, pdfBase64 }),
};

export default goodsReceiptApi;