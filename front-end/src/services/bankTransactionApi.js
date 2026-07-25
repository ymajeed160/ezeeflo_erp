import axiosInstance from './axiosInstance';

const bankTransactionApi = {
  getAll(params = {}) {
    return axiosInstance.get('/bank-transactions', { params }).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/bank-transactions/${id}`).then((res) => res.data);
  },
  getUnreconciled(bankAccountId) {
    return axiosInstance.get('/bank-transactions/unreconciled', { params: { bankAccountId } }).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/bank-transactions', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/bank-transactions/${id}`, data).then((res) => res.data);
  },
  post(id) {
    return axiosInstance.patch(`/bank-transactions/${id}/post`).then((res) => res.data);
  },
  reverse(id) {
    return axiosInstance.patch(`/bank-transactions/${id}/reverse`).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/bank-transactions/${id}`).then((res) => res.data);
  },
  importCSV(data) {
    return axiosInstance.post('/bank-transactions/import-csv', data).then((res) => res.data);
  },
};

export default bankTransactionApi;
