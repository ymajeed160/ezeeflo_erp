import hrApi from './hrApi';

/**
 * Employee API Service
 */
const EmployeeApi = {
  list: (params = {}) => hrApi.get('/employees', { params }),
  getById: (id) => hrApi.get(`/employees/${id}`),
  create: (data) => hrApi.post('/employees', data),
  update: (id, data) => hrApi.put(`/employees/${id}`, data),
  delete: (id) => hrApi.delete(`/employees/${id}`),
};

export default EmployeeApi;
