import axiosInstance from './axiosInstance';

const assetTransferApi = {
  getAll(params = {}) { return axiosInstance.get('/asset-transfers', { params }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/asset-transfers/${id}`).then((r) => r.data); },
  getNextNumber() { return axiosInstance.get('/asset-transfers/next-number').then((r) => r.data); },
  getByAsset(assetId) { return axiosInstance.get(`/asset-transfers/by-asset/${assetId}`).then((r) => r.data); },
  create(data) { return axiosInstance.post('/asset-transfers', data).then((r) => r.data); },
  delete(id) { return axiosInstance.delete(`/asset-transfers/${id}`).then((r) => r.data); },
};

export default assetTransferApi;
