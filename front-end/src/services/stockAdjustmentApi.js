import axiosInstance from './axiosInstance';

const stockAdjustmentApi = {
  getAll(params = {}) {
    return axiosInstance.get('/stock-adjustments', { params }).then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/stock-adjustments/${id}`).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/stock-adjustments', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/stock-adjustments/${id}`, data).then((res) => res.data);
  },

  approve(id) {
    return axiosInstance.patch(`/stock-adjustments/${id}/approve`).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/stock-adjustments/${id}`).then((res) => res.data);
  },
};

export default stockAdjustmentApi;