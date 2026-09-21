import api from '../utils/api';

const authApi = {
  login: (data) => api.post('/auth/login', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  logout: (data) => api.post('/auth/logout', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export default authApi;
