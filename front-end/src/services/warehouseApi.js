import axiosInstance from './axiosInstance';

const warehouseApi = {
  getAll(params = {}) {
    return axiosInstance.get('/warehouses', { params }).then((res) => res.data);
  },

  getActive() {
    return axiosInstance.get('/warehouses/active').then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/warehouses/${id}`).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/warehouses', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/warehouses/${id}`, data).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/warehouses/${id}`).then((res) => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/warehouses/${id}/toggle-status`).then((res) => res.data);
  },
};

export default warehouseApi;