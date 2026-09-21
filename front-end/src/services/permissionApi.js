import axiosInstance from './axiosInstance';

const permissionApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get('/permissions');
    return data;
  },
  getModules: async () => {
    const { data } = await axiosInstance.get('/permissions/modules');
    return data;
  },
};

export default permissionApi;