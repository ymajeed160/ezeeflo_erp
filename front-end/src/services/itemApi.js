import axiosInstance from './axiosInstance';

const itemApi = {
  getAll(params = {}) {
    return axiosInstance.get('/items', { params }).then(res => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/items/${id}`).then(res => res.data);
  },

  create(data) {
    return axiosInstance.post('/items', data).then(res => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/items/${id}`, data).then(res => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/items/${id}`).then(res => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/items/${id}/toggle-status`).then(res => res.data);
  },
};

export default itemApi;