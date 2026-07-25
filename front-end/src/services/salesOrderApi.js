import axiosInstance from './axiosInstance';

const salesOrderApi = {
  getAll: (params) => axiosInstance.get('/sales-orders', { params }),
  getById: (id) => axiosInstance.get(`/sales-orders/${id}`),
  create: (data) => axiosInstance.post('/sales-orders', data),
  update: (id, data) => axiosInstance.put(`/sales-orders/${id}`, data),
  delete: (id) => axiosInstance.delete(`/sales-orders/${id}`),
  approve: (id) => axiosInstance.patch(`/sales-orders/${id}/approve`),
  close: (id) => axiosInstance.patch(`/sales-orders/${id}/close`),
  sendEmail: (id, { to, subject, body, pdfBase64 }) => axiosInstance.post(`/sales-orders/${id}/send-email`, { to, subject, body, pdfBase64 }),
};

export default salesOrderApi;