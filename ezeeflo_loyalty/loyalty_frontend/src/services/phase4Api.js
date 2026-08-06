import api from '../utils/api';

export const campaignApi = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  updateStatus: (id, status) => api.patch(`/campaigns/${id}/status`, { status }),
  getActive: () => api.get('/campaigns/active'),
};

export const couponApi = {
  getAll: (params) => api.get('/coupons', { params }),
  getById: (id) => api.get(`/coupons/${id}`),
  generate: (data) => api.post('/coupons/generate', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  toggleStatus: (id) => api.patch(`/coupons/${id}/toggle-status`),
  validate: (data) => api.post('/coupons/validate', data),
  redeem: (data) => api.post('/coupons/redeem', data),
  getUsageHistory: (params) => api.get('/coupons/usage', { params }),
};

export const giftCardApi = {
  getAll: (params) => api.get('/giftcards', { params }),
  getById: (id) => api.get(`/giftcards/${id}`),
  purchase: (data) => api.post('/giftcards/purchase', data),
  redeem: (data) => api.post('/giftcards/redeem', data),
  recharge: (data) => api.post('/giftcards/recharge', data),
  cancel: (data) => api.post('/giftcards/cancel', data),
  getTransactions: (id) => api.get(`/giftcards/${id}/transactions`),
};

export const referralApi = {
  getAll: (params) => api.get('/referrals', { params }),
  getById: (id) => api.get(`/referrals/${id}`),
  generateCode: (data) => api.post('/referrals/generate-code', data),
  register: (data) => api.post('/referrals/register', data),
  grantRewards: (id) => api.post(`/referrals/${id}/grant-rewards`),
  getStats: (params) => api.get('/referrals/stats', { params }),
};
