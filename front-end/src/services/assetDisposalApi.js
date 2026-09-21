import axiosInstance from './axiosInstance';

const assetDisposalApi = {
  getAll(p) { return axiosInstance.get('/asset-disposals', { params: p }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/asset-disposals/${id}`).then((r) => r.data); },
  getNextNumber() { return axiosInstance.get('/asset-disposals/next-number').then((r) => r.data); },
  create(d) { return axiosInstance.post('/asset-disposals', d).then((r) => r.data); },
  post(id) { return axiosInstance.post(`/asset-disposals/${id}/post`).then((r) => r.data); },
  reverse(id) { return axiosInstance.post(`/asset-disposals/${id}/reverse`).then((r) => r.data); },
  del(id) { return axiosInstance.delete(`/asset-disposals/${id}`).then((r) => r.data); },
};

export default assetDisposalApi;
