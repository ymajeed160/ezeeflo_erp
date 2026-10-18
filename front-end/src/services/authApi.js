import axiosInstance from './axiosInstance';

const authApi = {
  login: async (credentials) => {
    const { data } = await axiosInstance.post('/auth/login', credentials);
    return data;
  },

  logout: async (refreshToken) => {
    const { data } = await axiosInstance.post('/auth/logout', { refreshToken });
    return data;
  },

  logoutAll: async () => {
    const { data } = await axiosInstance.post('/auth/logout-all');
    return data;
  },

  refreshToken: async (refreshToken) => {
    const { data } = await axiosInstance.post('/auth/refresh-token', { refreshToken });
    return data;
  },

  changePassword: async (passwordData) => {
    const { data } = await axiosInstance.post('/auth/change-password', passwordData);
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await axiosInstance.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, password) => {
    const { data } = await axiosInstance.post('/auth/reset-password', { token, password });
    return data;
  },

  getMe: async () => {
    const { data } = await axiosInstance.get('/auth/me');
    return data;
  },
};

export default authApi;