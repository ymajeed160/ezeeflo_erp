import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/superadmin/companies';

const getToken = () => {
  const stored = localStorage.getItem('persist:sa_auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored).accessToken;
  } catch { return null; }
};

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

export const getCompanies = async (params = {}) => {
  const { data } = await axios.get(API_BASE, { ...authHeaders(), params });
  return data;
};

export const getCompany = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`, authHeaders());
  return data.data;
};

export const createCompany = async (payload) => {
  const { data } = await axios.post(API_BASE, payload, authHeaders());
  return data;
};

export const updateCompany = async (id, payload) => {
  const { data } = await axios.put(`${API_BASE}/${id}`, payload, authHeaders());
  return data;
};

export const changeCompanyStatus = async (id, status) => {
  const { data } = await axios.patch(`${API_BASE}/${id}/status`, { status }, authHeaders());
  return data;
};

export const deleteCompany = async (id) => {
  const { data } = await axios.delete(`${API_BASE}/${id}`, authHeaders());
  return data;
};

export const exportCompanies = async (format = 'csv') => {
  const { data } = await axios.get(`${API_BASE}/export`, { ...authHeaders(), params: { format } });
  return data;
};
