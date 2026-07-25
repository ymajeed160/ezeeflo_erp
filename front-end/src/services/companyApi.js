import axiosInstance from './axiosInstance';

const companyApi = {
  getCompanies: async () => {
    const { data } = await axiosInstance.get('/companies');
    return data;
  },

  getCurrentCompany: async () => {
    const { data } = await axiosInstance.get('/companies/current');
    return data;
  },

  getCompanyById: async (id) => {
    const { data } = await axiosInstance.get(`/companies/${id}`);
    return data;
  },

  createCompany: async (companyData) => {
    const { data } = await axiosInstance.post('/companies', companyData);
    return data;
  },

  updateCompany: async (id, companyData) => {
    const { data } = await axiosInstance.put(`/companies/${id}`, companyData);
    return data;
  },

  selectCompany: async (companyId) => {
    const { data } = await axiosInstance.post('/companies/select', { companyId });
    return data;
  },

  switchCompany: async (companyId) => {
    const { data } = await axiosInstance.post('/companies/switch', { companyId });
    return data;
  },
};

export default companyApi;
