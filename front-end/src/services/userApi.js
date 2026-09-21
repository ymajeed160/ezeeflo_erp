import axiosInstance from './axiosInstance';

const userApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/users', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/users/${id}`);
    return data;
  },
  create: async (userData) => {
    const { data } = await axiosInstance.post('/users', userData);
    return data;
  },
  update: async (id, userData) => {
    const { data } = await axiosInstance.put(`/users/${id}`, userData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/users/${id}`);
    return data;
  },
  toggleStatus: async (id) => {
    const { data } = await axiosInstance.patch(`/users/${id}/toggle-status`);
    return data;
  },
  updateProfile: async (id, profileData) => {
    const { data } = await axiosInstance.put(`/users/${id}/profile`, profileData);
    return data;
  },
};

export default userApi;