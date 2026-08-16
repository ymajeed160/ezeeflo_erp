import axiosInstance from './axiosInstance';

const crvApi = {
  list: async (params = {}) => {
    const { data } = await axiosInstance.get('/cash-receipt-vouchers', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/cash-receipt-vouchers/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await axiosInstance.post('/cash-receipt-vouchers', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await axiosInstance.put(`/cash-receipt-vouchers/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/cash-receipt-vouchers/${id}`);
    return data;
  },
  post: async (id) => {
    const { data } = await axiosInstance.post(`/cash-receipt-vouchers/${id}/post`);
    return data;
  },
  reverse: async (id) => {
    const { data } = await axiosInstance.post(`/cash-receipt-vouchers/${id}/reverse`);
    return data;
  },
  cancel: async (id) => {
    const { data } = await axiosInstance.post(`/cash-receipt-vouchers/${id}/cancel`);
    return data;
  },
};

export default crvApi;
