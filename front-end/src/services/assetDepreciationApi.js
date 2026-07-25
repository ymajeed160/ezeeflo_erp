import axiosInstance from './axiosInstance';

const assetDepreciationApi = {
  getAll(params = {}) { return axiosInstance.get('/asset-depreciations', { params }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/asset-depreciations/${id}`).then((r) => r.data); },
  getNextNumber() { return axiosInstance.get('/asset-depreciations/next-number').then((r) => r.data); },
  preview(data) { return axiosInstance.post('/asset-depreciations/preview', data).then((r) => r.data); },
  post(data) { return axiosInstance.post('/asset-depreciations/post', data).then((r) => r.data); },
  reverse(id) { return axiosInstance.post(`/asset-depreciations/${id}/reverse`).then((r) => r.data); },
  delete(id) { return axiosInstance.delete(`/asset-depreciations/${id}`).then((r) => r.data); },
};

export default assetDepreciationApi;
