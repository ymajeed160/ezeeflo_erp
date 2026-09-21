import axiosInstance from './axiosInstance';

const itemCategoryApi = {
  getAll(params = {}) {
    return axiosInstance.get('/item-categories', { params }).then(res => res.data);
  },

  getTree() {
    return axiosInstance.get('/item-categories/tree').then(res => res.data);
  },

  getRoots() {
    return axiosInstance.get('/item-categories/roots').then(res => res.data);
  },

  getById(id) {
    return axiosInstance.get(`/item-categories/${id}`).then(res => res.data);
  },

  getChildren(parentId) {
    return axiosInstance.get(`/item-categories/${parentId}/children`).then(res => res.data);
  },

  create(data) {
    return axiosInstance.post('/item-categories', data).then(res => res.data);
  },

  update(id, data) {
    return axiosInstance.put(`/item-categories/${id}`, data).then(res => res.data);
  },

  delete(id) {
    return axiosInstance.delete(`/item-categories/${id}`).then(res => res.data);
  },

  toggleStatus(id) {
    return axiosInstance.patch(`/item-categories/${id}/toggle-status`).then(res => res.data);
  },
};

export default itemCategoryApi;