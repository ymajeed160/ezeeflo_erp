import hrApi from './hrApi';
const LeaveTypeApi = { list: (p) => hrApi.get('/leave-types', { params: p }), create: (d) => hrApi.post('/leave-types', d), update: (id, d) => hrApi.put(`/leave-types/${id}`, d), delete: (id) => hrApi.delete(`/leave-types/${id}`) };
export default LeaveTypeApi;
