import api from '../utils/api';

const membershipApi = {
  getTiers: (params) => api.get('/membership/tiers', { params }),
  getTierById: (id) => api.get(`/membership/tiers/${id}`),
  createTier: (data) => api.post('/membership/tiers', data),
  updateTier: (id, data) => api.put(`/membership/tiers/${id}`, data),
  deleteTier: (id) => api.delete(`/membership/tiers/${id}`),
  toggleTierStatus: (id) => api.patch(`/membership/tiers/${id}/toggle-status`),
  getTierStats: () => api.get('/membership/tiers/stats'),
  getCustomerHistory: (customerId) => api.get(`/membership/customers/${customerId}/history`),
  evaluateTier: (customerId) => api.post(`/membership/customers/${customerId}/evaluate`),
  assignTier: (customerId, data) => api.post(`/membership/customers/${customerId}/assign`, data),
};

export default membershipApi;
