import hrApi from './hrApi';

const AttendanceApi = {
  list: (p) => hrApi.get('/attendance', { params: p }),
  getById: (id) => hrApi.get(`/attendance/${id}`),
  mark: (d) => hrApi.post('/attendance/mark', d),
  bulkMark: (records) => hrApi.post('/attendance/bulk', { records }),
  update: (id, d) => hrApi.put(`/attendance/${id}`, d),
  delete: (id) => hrApi.delete(`/attendance/${id}`),
  todaySummary: () => hrApi.get('/attendance/today-summary'),
};
export default AttendanceApi;
