import axiosInstance from './axiosInstance';

const quotationApi = {
  getAll: (params) => axiosInstance.get('/quotations', { params }),
  getById: (id) => axiosInstance.get(`/quotations/${id}`),
  create: (data) => axiosInstance.post('/quotations', data),
  update: (id, data) => axiosInstance.put(`/quotations/${id}`, data),
  delete: (id, reason) => axiosInstance.delete(`/quotations/${id}`, { data: { reason } }),
  updateStatus: (id, status) => axiosInstance.patch(`/quotations/${id}/status`, { status }),
  approve: (id) => axiosInstance.patch(`/quotations/${id}/approve`),
  confirm: (id) => axiosInstance.post(`/quotations/${id}/confirm`),
  reject: (id) => axiosInstance.patch(`/quotations/${id}/reject`),
  cancel: (id, reason) => axiosInstance.patch(`/quotations/${id}/cancel`, { reason }),
  restore: (id) => axiosInstance.post(`/quotations/${id}/restore`),
  convertToSalesOrder: (id, data) => axiosInstance.post(`/quotations/${id}/convert-to-sales-order`, data || {}),
  getConvertibleLines: (id) => axiosInstance.get(`/quotations/${id}/convertible-lines`),
};

export default quotationApi;