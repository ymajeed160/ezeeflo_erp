import api from '../utils/api';

const rewardApi = {
  getAll: (params) => api.get('/rewards', { params }),
  getById: (id) => api.get(`/rewards/${id}`),
  create: (data) => api.post('/rewards', data),
  update: (id, data) => api.put(`/rewards/${id}`, data),
  delete: (id) => api.delete(`/rewards/${id}`),
  toggleStatus: (id) => api.patch(`/rewards/${id}/toggle-status`),
  redeem: (data) => api.post('/rewards/redeem', data),
  cancelRedemption: (redemptionId) => api.post(`/rewards/redemptions/${redemptionId}/cancel`),
  getRedemptions: (params) => api.get('/rewards/redemptions', { params }),
};

export default rewardApi;
