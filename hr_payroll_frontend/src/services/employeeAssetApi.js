import hrApi from './hrApi';

/**
 * Employee Assets API Service
 */
const EmployeeAssetApi = {
  list: (params = {}) => hrApi.get('/employee-assets', { params }),
  getById: (id) => hrApi.get(`/employee-assets/${id}`),
  getByEmployee: (employeeId) => hrApi.get(`/employee-assets/employee/${employeeId}`),
  create: (data) => hrApi.post('/employee-assets', data),
  update: (id, data) => hrApi.put(`/employee-assets/${id}`, data),
  delete: (id) => hrApi.delete(`/employee-assets/${id}`),
};

export default EmployeeAssetApi;
