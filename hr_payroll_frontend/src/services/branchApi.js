import hrApi from './hrApi';

const BranchApi = {
  list: (params) => hrApi.get('/branches', { params }),
  getById: (id) => hrApi.get(`/branches/${id}`),
  create: (data) => hrApi.post('/branches', data),
  update: (id, data) => hrApi.put(`/branches/${id}`, data),
  delete: (id) => hrApi.delete(`/branches/${id}`),
};

export default BranchApi;
