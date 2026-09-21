import api from '../utils/api';

const companyApi = {
  getAll: (params) => api.get('/superadmin/companies', { params }),
  getById: (id) => api.get(`/superadmin/companies/${id}`),
  create: (data) => api.post('/superadmin/companies', data),
  update: (id, data) => api.put(`/superadmin/companies/${id}`, data),
  updateStatus: (id, status) => api.patch(`/superadmin/companies/${id}/status`, { status }),
  delete: (id) => api.delete(`/superadmin/companies/${id}`),
  assignPlan: (companyId, data) => api.post(`/superadmin/companies/${companyId}/assign-plan`, data),
};

export default companyApi;
