import axiosInstance from './axiosInstance';

const assetCategoryApi = {
  getAll(params = {}) {
    return axiosInstance.get('/asset-categories', { params }).then((res) => res.data);
  },
  getActive() {
    return axiosInstance.get('/asset-categories/active').then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/asset-categories/${id}`).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/asset-categories', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/asset-categories/${id}`, data).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/asset-categories/${id}`).then((res) => res.data);
  },
  toggleStatus(id) {
    return axiosInstance.patch(`/asset-categories/${id}/toggle-status`).then((res) => res.data);
  },
};

export default assetCategoryApi;
