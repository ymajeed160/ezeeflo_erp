import axiosInstance from './axiosInstance';

const customerApi = {
  getAll(params = {}) {
    return axiosInstance.get('/customers', { params }).then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/customers/${id}`).then((res) => res.data);
  },

  getSelect(search = '') {
    return axiosInstance.get('/customers/select', { params: { search } }).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/customers', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/customers/${id}`, data).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/customers/${id}`).then((res) => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/customers/${id}/toggle-status`).then((res) => res.data);
  },
};

export default customerApi;