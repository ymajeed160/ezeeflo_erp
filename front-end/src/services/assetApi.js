import axiosInstance from './axiosInstance';

const assetApi = {
  getAll(params = {}) {
    return axiosInstance.get('/assets', { params }).then((res) => res.data);
  },
  getActive() {
    return axiosInstance.get('/assets/active').then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/assets/${id}`).then((res) => res.data);
  },
  getNextCode() {
    return axiosInstance.get('/assets/next-code').then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/assets', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/assets/${id}`, data).then((res) => res.data);
  },
  updateStatus(id, status) {
    return axiosInstance.patch(`/assets/${id}/status`, { status }).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/assets/${id}`).then((res) => res.data);
  },
};

export default assetApi;
