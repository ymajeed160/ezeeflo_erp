import axiosInstance from './axiosInstance';

const cpvApi = {
  list: async (params = {}) => {
    const { data } = await axiosInstance.get('/cash-payment-vouchers', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/cash-payment-vouchers/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await axiosInstance.post('/cash-payment-vouchers', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await axiosInstance.put(`/cash-payment-vouchers/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/cash-payment-vouchers/${id}`);
    return data;
  },
  post: async (id) => {
    const { data } = await axiosInstance.post(`/cash-payment-vouchers/${id}/post`);
    return data;
  },
  reverse: async (id) => {
    const { data } = await axiosInstance.post(`/cash-payment-vouchers/${id}/reverse`);
    return data;
  },
  cancel: async (id) => {
    const { data } = await axiosInstance.post(`/cash-payment-vouchers/${id}/cancel`);
    return data;
  },
};

export default cpvApi;
