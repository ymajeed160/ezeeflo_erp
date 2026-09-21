import axiosInstance from './axiosInstance';

const paymentVoucherApi = {
  getAll(params) { return axiosInstance.get('/payment-vouchers', { params }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/payment-vouchers/${id}`).then((r) => r.data); },
  getInvoicesForAllocation(supplierId, excludeVoucherId) {
    const params = { supplierId };
    if (excludeVoucherId) params.excludeVoucherId = excludeVoucherId;
    return axiosInstance.get('/payment-vouchers/invoices-for-allocation', { params }).then((r) => r.data);
  },
  create(data) { return axiosInstance.post('/payment-vouchers', data).then((r) => r.data); },
  update(id, data) { return axiosInstance.put(`/payment-vouchers/${id}`, data).then((r) => r.data); },
  post(id) { return axiosInstance.patch(`/payment-vouchers/${id}/post`).then((r) => r.data); },
  reverse(id) { return axiosInstance.patch(`/payment-vouchers/${id}/reverse`).then((r) => r.data); },
  delete(id) { return axiosInstance.delete(`/payment-vouchers/${id}`).then((r) => r.data); },
};
export default paymentVoucherApi;
