import axiosInstance from './axiosInstance';

const roleApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get('/roles');
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/roles/${id}`);
    return data;
  },
  create: async (roleData) => {
    const { data } = await axiosInstance.post('/roles', roleData);
    return data;
  },
  update: async (id, roleData) => {
    const { data } = await axiosInstance.put(`/roles/${id}`, roleData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/roles/${id}`);
    return data;
  },
};

export default roleApi;