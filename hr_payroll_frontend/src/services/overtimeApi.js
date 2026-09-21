import hrApi from './hrApi';

const OvertimeApi = {
  list: (p) => hrApi.get('/overtime', { params: p }),
  getById: (id) => hrApi.get(`/overtime/${id}`),
  create: (d) => hrApi.post('/overtime', d),
  update: (id, d) => hrApi.put(`/overtime/${id}`, d),
  delete: (id) => hrApi.delete(`/overtime/${id}`),
  approve: (id) => hrApi.post(`/overtime/${id}/approve`),
};
export default OvertimeApi;
