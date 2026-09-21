import api from '../utils/api';

export const reportsApi = {
  customerLedger: (params) => api.get('/reports/customer-ledger', { params }),
  pointsExpiry: (params) => api.get('/reports/points-expiry', { params }),
  redeemedRewards: (params) => api.get('/reports/redeemed-rewards', { params }),
  campaignPerformance: (params) => api.get('/reports/campaign-performance', { params }),
  topCustomers: (params) => api.get('/reports/top-customers', { params }),
  inactiveCustomers: (params) => api.get('/reports/inactive-customers', { params }),
  membershipReport: () => api.get('/reports/membership'),
  revenueImpact: (params) => api.get('/reports/revenue-impact', { params }),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  monthlyTrends: (params) => api.get('/analytics/monthly-trends', { params }),
  topCampaigns: (params) => api.get('/analytics/top-campaigns', { params }),
  customerGrowth: (params) => api.get('/analytics/customer-growth', { params }),
};

export const notificationApi = {
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data) => api.post('/notifications/templates', data),
  updateTemplate: (id, data) => api.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/notifications/templates/${id}`),
  send: (data) => api.post('/notifications/send', data),
  getHistory: (params) => api.get('/notifications/history', { params }),
};

export const integrationApi = {
  listKeys: () => api.get('/integrations/keys'),
  createKey: (data) => api.post('/integrations/keys', data),
  revokeKey: (id) => api.patch(`/integrations/keys/${id}/revoke`),
  deleteKey: (id) => api.delete(`/integrations/keys/${id}`),
  getAuditLogs: (params) => api.get('/integrations/audit/logs', { params }),
  getAuditActions: () => api.get('/integrations/audit/actions'),
  getAuditEntityTypes: () => api.get('/integrations/audit/entity-types'),
};
