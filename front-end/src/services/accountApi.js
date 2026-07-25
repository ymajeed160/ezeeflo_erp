import axiosInstance from './axiosInstance';

const accountApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/accounts', { params });
    return data;
  },
  getTree: async () => {
    const { data } = await axiosInstance.get('/accounts/tree');
    return data;
  },
  getRoots: async () => {
    const { data } = await axiosInstance.get('/accounts/roots');
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/accounts/${id}`);
    return data;
  },
  getByType: async (type) => {
    const { data } = await axiosInstance.get(`/accounts/type/${type}`);
    return data;
  },
  getChildren: async (parentId) => {
    const { data } = await axiosInstance.get(`/accounts/children/${parentId}`);
    return data;
  },
  create: async (accountData) => {
    const { data } = await axiosInstance.post('/accounts', accountData);
    return data;
  },
  update: async (id, accountData) => {
    const { data } = await axiosInstance.put(`/accounts/${id}`, accountData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/accounts/${id}`);
    return data;
  },
  toggleStatus: async (id) => {
    const { data } = await axiosInstance.patch(`/accounts/${id}/toggle-status`);
    return data;
  },
};

export default accountApi;