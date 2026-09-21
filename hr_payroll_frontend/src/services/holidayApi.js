import hrApi from './hrApi';
const HolidayApi = { list: (p) => hrApi.get('/holidays', { params: p }), create: (d) => hrApi.post('/holidays', d), update: (id, d) => hrApi.put(`/holidays/${id}`, d), delete: (id) => hrApi.delete(`/holidays/${id}`) };
export default HolidayApi;
