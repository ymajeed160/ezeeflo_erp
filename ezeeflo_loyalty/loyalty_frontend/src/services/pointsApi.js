import api from '../utils/api';

const pointsApi = {
  earn: (data) => api.post('/points/earn', data),
  redeem: (data) => api.post('/points/redeem', data),
  reverse: (data) => api.post('/points/reverse', data),
  adjust: (data) => api.post('/points/adjust', data),
  transfer: (data) => api.post('/points/transfer', data),
  expire: () => api.post('/points/expire'),
  welcomeBonus: (data) => api.post('/points/welcome-bonus', data),
  birthdayBonus: (data) => api.post('/points/birthday-bonus', data),
  calculate: (params) => api.get('/points/calculate', { params }),
  getTransactions: (params) => api.get('/points/transactions', { params }),
  getTransactionById: (id) => api.get(`/points/transactions/${id}`),
  getTransactionSummary: (params) => api.get('/points/transactions/summary', { params }),
  getCustomerTransactions: (customerId, params) => api.get(`/points/customers/${customerId}/transactions`, { params }),
};

export default pointsApi;
