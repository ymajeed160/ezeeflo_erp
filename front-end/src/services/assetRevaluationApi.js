import axiosInstance from './axiosInstance';

const assetRevaluationApi = {
  getAll(p) { return axiosInstance.get('/asset-revaluations', { params: p }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/asset-revaluations/${id}`).then((r) => r.data); },
  getNextNumber() { return axiosInstance.get('/asset-revaluations/next-number').then((r) => r.data); },
  create(d) { return axiosInstance.post('/asset-revaluations', d).then((r) => r.data); },
  post(id) { return axiosInstance.post(`/asset-revaluations/${id}/post`).then((r) => r.data); },
  del(id) { return axiosInstance.delete(`/asset-revaluations/${id}`).then((r) => r.data); },
};

export default assetRevaluationApi;
