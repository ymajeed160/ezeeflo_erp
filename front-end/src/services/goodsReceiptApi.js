import api from './api';

const goodsReceiptApi = {
  list: (params) => api.get('/goods-receipts', { params }),
  getById: (id) => api.get(`/goods-receipts/${id}`),
  create: (data) => api.post('/goods-receipts', data),
  update: (id, data) => api.put(`/goods-receipts/${id}`, data),
  delete: (id) => api.delete(`/goods-receipts/${id}`),
  approve: (id) => api.patch(`/goods-receipts/${id}/approve`),
  cancel: (id) => api.patch(`/goods-receipts/${id}/cancel`),
  sendEmail: (id, { to, subject, body, pdfBase64 }) => api.post(`/goods-receipts/${id}/send-email`, { to, subject, body, pdfBase64 }),
};

export default goodsReceiptApi;