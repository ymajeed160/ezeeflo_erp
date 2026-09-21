import axiosInstance from './axiosInstance';

const subscriptionModuleApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/superadmin/modules', { params });
    return data;
  },
  getActive: async () => {
    const { data } = await axiosInstance.get('/superadmin/modules/active');
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/superadmin/modules/${id}`);
    return data;
  },
  create: async (moduleData) => {
    const { data } = await axiosInstance.post('/superadmin/modules', moduleData);
    return data;
  },
  update: async (id, moduleData) => {
    const { data } = await axiosInstance.put(`/superadmin/modules/${id}`, moduleData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/superadmin/modules/${id}`);
    return data;
  },
};

export default subscriptionModuleApi;
