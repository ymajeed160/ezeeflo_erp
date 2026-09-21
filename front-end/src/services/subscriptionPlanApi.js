import axiosInstance from './axiosInstance';

const subscriptionPlanApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/superadmin/plans', { params });
    return data;
  },
  getAllWithModules: async () => {
    const { data } = await axiosInstance.get('/superadmin/plans/with-modules');
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/superadmin/plans/${id}`);
    return data;
  },
  create: async (planData) => {
    const { data } = await axiosInstance.post('/superadmin/plans', planData);
    return data;
  },
  update: async (id, planData) => {
    const { data } = await axiosInstance.put(`/superadmin/plans/${id}`, planData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/superadmin/plans/${id}`);
    return data;
  },
  toggleStatus: async (id) => {
    const { data } = await axiosInstance.patch(`/superadmin/plans/${id}/toggle-status`);
    return data;
  },
};

export default subscriptionPlanApi;
