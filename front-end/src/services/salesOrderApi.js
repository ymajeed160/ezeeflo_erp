import axiosInstance from './axiosInstance';

const salesOrderApi = {
  getAll: (params) => axiosInstance.get('/sales-orders', { params }),
  getById: (id) => axiosInstance.get(`/sales-orders/${id}`),
  create: (data) => axiosInstance.post('/sales-orders', data),
  update: (id, data) => axiosInstance.put(`/sales-orders/${id}`, data),
  delete: (id, reason) => axiosInstance.delete(`/sales-orders/${id}`, { data: { reason } }),
  approve: (id) => axiosInstance.patch(`/sales-orders/${id}/approve`),
  close: (id) => axiosInstance.patch(`/sales-orders/${id}/close`),
  cancel: (id, reason) => axiosInstance.post(`/sales-orders/${id}/cancel`, { reason }),
  restore: (id) => axiosInstance.post(`/sales-orders/${id}/restore`),
  sendEmail: (id, { to, subject, body, pdfBase64 }) => axiosInstance.post(`/sales-orders/${id}/send-email`, { to, subject, body, pdfBase64 }),
  getDeliverableLines: (id) => axiosInstance.get(`/sales-orders/${id}/deliverable-lines`),
  getInvoiceableLines: (id) => axiosInstance.get(`/sales-orders/${id}/invoiceable-lines`),
};

export default salesOrderApi;