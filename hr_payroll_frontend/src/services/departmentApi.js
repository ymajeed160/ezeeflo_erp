import hrApi from './hrApi';

const DepartmentApi = {
  list: (params) => hrApi.get('/departments', { params }),
  getById: (id) => hrApi.get(`/departments/${id}`),
  create: (data) => hrApi.post('/departments', data),
  update: (id, data) => hrApi.put(`/departments/${id}`, data),
  delete: (id) => hrApi.delete(`/departments/${id}`),
};

export default DepartmentApi;
