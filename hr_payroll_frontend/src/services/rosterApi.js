import hrApi from './hrApi';

const RosterApi = {
  list: (p) => hrApi.get('/rosters', { params: p }),
  create: (d) => hrApi.post('/rosters', d),
  bulkCreate: (records) => hrApi.post('/rosters/bulk', { records }),
  generate: (dateFrom, dateTo) => hrApi.post('/rosters/generate', { dateFrom, dateTo }),
  update: (id, d) => hrApi.put(`/rosters/${id}`, d),
  delete: (id) => hrApi.delete(`/rosters/${id}`),
};
export default RosterApi;
