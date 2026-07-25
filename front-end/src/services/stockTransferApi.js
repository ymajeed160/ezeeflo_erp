import axiosInstance from './axiosInstance';

const stockTransferApi = {
  getAll(params = {}) {
    return axiosInstance.get('/stock-transfers', { params }).then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/stock-transfers/${id}`).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/stock-transfers', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/stock-transfers/${id}`, data).then((res) => res.data);
  },

  approve(id) {
    return axiosInstance.patch(`/stock-transfers/${id}/approve`).then((res) => res.data);
  },

  complete(id) {
    return axiosInstance.patch(`/stock-transfers/${id}/complete`).then((res) => res.data);
  },

  cancel(id) {
    return axiosInstance.patch(`/stock-transfers/${id}/cancel`).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/stock-transfers/${id}`).then((res) => res.data);
  },
};

export default stockTransferApi;