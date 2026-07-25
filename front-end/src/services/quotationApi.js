import axiosInstance from './axiosInstance';

const quotationApi = {
  getAll: (params) => axiosInstance.get('/quotations', { params }),
  getById: (id) => axiosInstance.get(`/quotations/${id}`),
  create: (data) => axiosInstance.post('/quotations', data),
  update: (id, data) => axiosInstance.put(`/quotations/${id}`, data),
  delete: (id) => axiosInstance.delete(`/quotations/${id}`),
  updateStatus: (id, status) => axiosInstance.patch(`/quotations/${id}/status`, { status }),
  approve: (id) => axiosInstance.patch(`/quotations/${id}/approve`),
  reject: (id) => axiosInstance.patch(`/quotations/${id}/reject`),
  convertToSalesOrder: (id) => axiosInstance.post(`/quotations/${id}/convert-to-sales-order`),
};

export default quotationApi;