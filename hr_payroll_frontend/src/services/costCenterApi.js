import hrApi from './hrApi';

const CostCenterApi = {
  list: (params) => hrApi.get('/cost-centers', { params }),
  getById: (id) => hrApi.get(`/cost-centers/${id}`),
  create: (data) => hrApi.post('/cost-centers', data),
  update: (id, data) => hrApi.put(`/cost-centers/${id}`, data),
  delete: (id) => hrApi.delete(`/cost-centers/${id}`),
};

export default CostCenterApi;
