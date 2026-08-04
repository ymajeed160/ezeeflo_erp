import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/superadmin/subscriptions';

const getToken = () => {
  const stored = localStorage.getItem('persist:sa_auth');
  if (!stored) return null;
  try { return JSON.parse(stored).accessToken; } catch { return null; }
};

const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export const getPlans = async () => {
  const { data } = await axios.get(`${API_BASE}/plans`, authHeaders());
  return data.data;
};

export const createPlan = async (payload) => {
  const { data } = await axios.post(`${API_BASE}/plans`, payload, authHeaders());
  return data;
};

export const updatePlan = async (id, payload) => {
  const { data } = await axios.put(`${API_BASE}/plans/${id}`, payload, authHeaders());
  return data;
};

export const deletePlan = async (id) => {
  const { data } = await axios.delete(`${API_BASE}/plans/${id}`, authHeaders());
  return data;
};

export const seedDefaultPlans = async () => {
  const { data } = await axios.post(`${API_BASE}/plans/seed`, {}, authHeaders());
  return data;
};

export const getCompanyModules = async (companyId) => {
  const { data } = await axios.get(`${API_BASE}/modules`, { ...authHeaders(), params: { companyId } });
  return data.data;
};

export const toggleModule = async (companyId, moduleCode, isEnabled) => {
  const { data } = await axios.post(`${API_BASE}/modules/toggle`, { companyId, moduleCode, isEnabled }, authHeaders());
  return data;
};
