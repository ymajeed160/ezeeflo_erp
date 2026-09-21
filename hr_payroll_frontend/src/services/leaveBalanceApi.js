import hrApi from './hrApi';
const LeaveBalanceApi = {
  list: (p) => hrApi.get('/leave-balances', { params: p }), create: (d) => hrApi.post('/leave-balances', d),
  initialize: (employeeId) => hrApi.post('/leave-balances/initialize', { employeeId }),
  update: (id, d) => hrApi.put(`/leave-balances/${id}`, d), delete: (id) => hrApi.delete(`/leave-balances/${id}`),
};
export default LeaveBalanceApi;
