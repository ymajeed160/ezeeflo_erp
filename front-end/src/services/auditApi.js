import axiosInstance from './axiosInstance';

const auditApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/audit-logs', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/audit-logs/${id}`);
    return data;
  },
  getEntityHistory: async (entityType, entityId, params = {}) => {
    const { data } = await axiosInstance.get(`/audit-logs/entity/${entityType}/${entityId}`, { params });
    return data;
  },
  getByUser: async (userId, params = {}) => {
    const { data } = await axiosInstance.get(`/audit-logs/user/${userId}`, { params });
    return data;
  },
  getReport: async (reportType, params = {}) => {
    const { data } = await axiosInstance.get(`/audit-logs/reports/${reportType}`, { params });
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/audit-logs/${id}`);
    return data;
  },
};

export default auditApi;
