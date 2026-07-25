import api from './api';

const reportApi = {
  execute: (reportName, params) => api.get(`/reports/${reportName}`, { params }),
};

export default reportApi;
