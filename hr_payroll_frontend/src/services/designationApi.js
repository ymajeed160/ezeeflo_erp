import hrApi from './hrApi';

const DesignationApi = {
  list: (params) => hrApi.get('/designations', { params }),
  getById: (id) => hrApi.get(`/designations/${id}`),
  create: (data) => hrApi.post('/designations', data),
  update: (id, data) => hrApi.put(`/designations/${id}`, data),
  delete: (id) => hrApi.delete(`/designations/${id}`),
};

export default DesignationApi;
