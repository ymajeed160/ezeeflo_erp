import hrApi from './hrApi';

const ShiftApi = { list: (p) => hrApi.get('/shifts', { params: p }), getById: (id) => hrApi.get(`/shifts/${id}`), create: (d) => hrApi.post('/shifts', d), update: (id, d) => hrApi.put(`/shifts/${id}`, d), delete: (id) => hrApi.delete(`/shifts/${id}`) };
export default ShiftApi;
