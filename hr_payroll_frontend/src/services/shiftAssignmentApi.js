import hrApi from './hrApi';

const ShiftAssignmentApi = {
  list: (p) => hrApi.get('/shift-assignments', { params: p }),
  create: (d) => hrApi.post('/shift-assignments', d),
  update: (id, d) => hrApi.put(`/shift-assignments/${id}`, d),
  delete: (id) => hrApi.delete(`/shift-assignments/${id}`),
};
export default ShiftAssignmentApi;
