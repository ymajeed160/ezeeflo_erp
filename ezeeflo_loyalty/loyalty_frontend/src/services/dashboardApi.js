import api from '../utils/api';

const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getSuperAdminStats: () => api.get('/superadmin/dashboard/stats'),
};

export default dashboardApi;
