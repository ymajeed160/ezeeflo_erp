import axiosInstance from './axiosInstance';

const paymentReceiptApi = {
  getAll(params = {}) {
    return axiosInstance.get('/payment-receipts', { params }).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/payment-receipts/${id}`).then((res) => res.data);
  },
  getInvoicesForAllocation(customerId, excludeReceiptId) {
    const params = { customerId };
    if (excludeReceiptId) params.excludeReceiptId = excludeReceiptId;
    return axiosInstance.get('/payment-receipts/invoices-for-allocation', { params }).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/payment-receipts', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/payment-receipts/${id}`, data).then((res) => res.data);
  },
  post(id) {
    return axiosInstance.patch(`/payment-receipts/${id}/post`).then((res) => res.data);
  },
  reverse(id) {
    return axiosInstance.patch(`/payment-receipts/${id}/reverse`).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/payment-receipts/${id}`).then((res) => res.data);
  },
};

export default paymentReceiptApi;
