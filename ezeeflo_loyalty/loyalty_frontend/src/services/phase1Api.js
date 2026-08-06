import api from '../utils/api';

const loyaltyRuleApi = {
  getAll: (params) => api.get('/loyalty-rules', { params }),
  getById: (id) => api.get(`/loyalty-rules/${id}`),
  create: (data) => api.post('/loyalty-rules', data),
  update: (id, data) => api.put(`/loyalty-rules/${id}`, data),
  delete: (id) => api.delete(`/loyalty-rules/${id}`),
  toggleStatus: (id) => api.patch(`/loyalty-rules/${id}/toggle`),
  evaluate: (data) => api.post('/loyalty-rules/evaluate', data),
};

const walletApi = {
  getCustomerWallet: (customerId) => api.get(`/wallet/customer/${customerId}`),
  getWalletsSummary: (params) => api.get('/wallet', { params }),
};

export { loyaltyRuleApi, walletApi };
