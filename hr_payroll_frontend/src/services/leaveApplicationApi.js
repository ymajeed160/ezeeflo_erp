import hrApi from './hrApi';
const LeaveApplicationApi = {
  list: (p) => hrApi.get('/leave-applications', { params: p }), getById: (id) => hrApi.get(`/leave-applications/${id}`),
  create: (d) => hrApi.post('/leave-applications', d), update: (id, d) => hrApi.put(`/leave-applications/${id}`, d),
  delete: (id) => hrApi.delete(`/leave-applications/${id}`),
  approve: (id) => hrApi.post(`/leave-applications/${id}/approve`),
  reject: (id, reason) => hrApi.post(`/leave-applications/${id}/reject`, { reason }),
  summary: () => hrApi.get('/leave-applications/summary'),
};
export const LeaveBalanceApi = {
  voidBalance: (id, reason) => hrApi.post(`/leave-balances/${id}/void`, { reason }),
};
export default LeaveApplicationApi;
