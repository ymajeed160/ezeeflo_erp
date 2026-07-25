import axiosInstance from './axiosInstance';

const api = {
  getAll(params) { return axiosInstance.get('/bank-reconciliations', { params }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/bank-reconciliations/${id}`).then((r) => r.data); },
  create(data) { return axiosInstance.post('/bank-reconciliations', data).then((r) => r.data); },
  importLines(id, data) { return axiosInstance.post(`/bank-reconciliations/${id}/import-lines`, data).then((r) => r.data); },
  manualMatch(id, lineId, bankTransactionId) { return axiosInstance.post(`/bank-reconciliations/${id}/manual-match`, { lineId, bankTransactionId }).then((r) => r.data); },
  unmatchLine(id, lineId) { return axiosInstance.post(`/bank-reconciliations/${id}/unmatch`, { lineId }).then((r) => r.data); },
  complete(id) { return axiosInstance.post(`/bank-reconciliations/${id}/complete`).then((r) => r.data); },
  overrideComplete(id) { return axiosInstance.post(`/bank-reconciliations/${id}/override-complete`).then((r) => r.data); },
  reverse(id) { return axiosInstance.post(`/bank-reconciliations/${id}/reverse`).then((r) => r.data); },
  delete(id) { return axiosInstance.delete(`/bank-reconciliations/${id}`).then((r) => r.data); },
  getUnmatchedTransactions(bankAccountId, dateFrom, dateTo) {
    return axiosInstance.get('/bank-reconciliations/unmatched-transactions', { params: { bankAccountId, dateFrom, dateTo } }).then((r) => r.data);
  },
};
export default api;
