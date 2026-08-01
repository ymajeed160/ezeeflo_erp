import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/hr';

/**
 * Login against HR backend
 */
export const login = async ({ email, password }) => {
  const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
  if (!data.success) throw new Error(data.message || 'Login failed');
  return data.data;
};

/**
 * Get current user from token
 */
export const getMe = async (token) => {
  const { data } = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};
