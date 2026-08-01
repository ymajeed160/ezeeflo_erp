import hrApi from './hrApi';

/**
 * Dashboard API Service
 */
const DashboardApi = {
  getSummary: () => hrApi.get('/dashboard/summary'),
};

export default DashboardApi;
