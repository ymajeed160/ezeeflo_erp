import axiosInstance from './axiosInstance';

const sellingResourceApi = {
  // ---- Selling Resources ----
  getAll(params = {}) {
    return axiosInstance.get('/selling-resources', { params }).then((res) => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/selling-resources/${id}`).then((res) => res.data);
  },

  getSelect(search = '') {
    return axiosInstance.get('/selling-resources/select', { params: { search } }).then((res) => res.data);
  },

  create(data) {
    return axiosInstance.post('/selling-resources', data).then((res) => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/selling-resources/${id}`, data).then((res) => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/selling-resources/${id}`).then((res) => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/selling-resources/${id}/toggle-status`).then((res) => res.data);
  },

  // ---- Resource Types ----
  getTypes(params = {}) {
    return axiosInstance.get('/selling-resources/types/list', { params }).then((res) => res.data);
  },

  getTypeById(id) {
    return axiosInstance.get(`/selling-resources/types/${id}`).then((res) => res.data);
  },

  createType(data) {
    return axiosInstance.post('/selling-resources/types', data).then((res) => res.data);
  },

  updateType(id, data) {
    return axiosInstance.put(`/selling-resources/types/${id}`, data).then((res) => res.data);
  },

  deleteType(id) {
    return axiosInstance.delete(`/selling-resources/types/${id}`).then((res) => res.data);
  },
};

export default sellingResourceApi;
