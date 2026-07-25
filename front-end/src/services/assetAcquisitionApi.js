import axiosInstance from './axiosInstance';

const assetAcquisitionApi = {
  getAll(params = {}) {
    return axiosInstance.get('/asset-acquisitions', { params }).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/asset-acquisitions/${id}`).then((res) => res.data);
  },
  getNextNumber() {
    return axiosInstance.get('/asset-acquisitions/next-number').then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/asset-acquisitions', data).then((res) => res.data);
  },
  post(id) {
    return axiosInstance.post(`/asset-acquisitions/${id}/post`).then((res) => res.data);
  },
  reverse(id) {
    return axiosInstance.post(`/asset-acquisitions/${id}/reverse`).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/asset-acquisitions/${id}`).then((res) => res.data);
  },
};

export default assetAcquisitionApi;
