import axiosInstance from './axiosInstance';

const itemVariantApi = {
  listByItem(itemId, params = {}) {
    return axiosInstance.get(`/item-variants/item/${itemId}`, { params }).then((res) => res.data);
  },
  search(params = {}) {
    return axiosInstance.get('/item-variants/search', { params }).then((res) => res.data);
  },
  getApplicableAttributes(itemId) {
    return axiosInstance.get(`/item-variants/item/${itemId}/attributes`).then((res) => res.data);
  },
  resolve(itemId, data) {
    return axiosInstance.post(`/item-variants/item/${itemId}/resolve`, data).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/item-variants/${id}`).then((res) => res.data);
  },
  toggleStatus(id) {
    return axiosInstance.patch(`/item-variants/${id}/toggle-status`).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/item-variants/${id}`).then((res) => res.data);
  },
};

export default itemVariantApi;
