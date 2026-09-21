import axiosInstance from './axiosInstance';

const supplierApi = {
  getAll(params = {}) {
    return axiosInstance.get('/suppliers', { params }).then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/suppliers/${id}`).then((res) => res.data);
  },

  getSelect(search = '') {
    return axiosInstance.get('/suppliers/select', { params: { search } }).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/suppliers', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/suppliers/${id}`, data).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/suppliers/${id}`).then((res) => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/suppliers/${id}/toggle-status`).then((res) => res.data);
  },
};

export default supplierApi;