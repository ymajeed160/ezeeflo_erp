import axiosInstance from './axiosInstance';

const companySubscriptionApi = {
  getDashboardStats: async () => {
    const { data } = await axiosInstance.get('/superadmin/subscriptions/dashboard/stats');
    return data;
  },
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/superadmin/subscriptions', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/superadmin/subscriptions/${id}`);
    return data;
  },
  getByCompany: async (companyId) => {
    const { data } = await axiosInstance.get(`/superadmin/subscriptions/company/${companyId}`);
    return data;
  },
  create: async (subData) => {
    const { data } = await axiosInstance.post('/superadmin/subscriptions', subData);
    return data;
  },
  update: async (id, subData) => {
    const { data } = await axiosInstance.put(`/superadmin/subscriptions/${id}`, subData);
    return data;
  },
  cancel: async (id) => {
    const { data } = await axiosInstance.post(`/superadmin/subscriptions/${id}/cancel`);
    return data;
  },
};

export default companySubscriptionApi;
