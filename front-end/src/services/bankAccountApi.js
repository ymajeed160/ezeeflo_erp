import axiosInstance from './axiosInstance';

const bankAccountApi = {
  getAll(params = {}) {
    return axiosInstance.get('/bank-accounts', { params }).then((res) => res.data);
  },
  getActive() {
    return axiosInstance.get('/bank-accounts/active').then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/bank-accounts/${id}`).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/bank-accounts', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/bank-accounts/${id}`, data).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/bank-accounts/${id}`).then((res) => res.data);
  },
  toggleStatus(id) {
    return axiosInstance.patch(`/bank-accounts/${id}/toggle-status`).then((res) => res.data);
  },
  setDefault(id) {
    return axiosInstance.patch(`/bank-accounts/${id}/set-default`).then((res) => res.data);
  },
};

export default bankAccountApi;
