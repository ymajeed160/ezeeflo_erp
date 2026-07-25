import axios from 'axios';
import { getActiveCompanyId } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper to safely get persisted state
const getPersistedState = (key) => {
  try {
    const rootState = localStorage.getItem('persist:root');
    if (rootState) {
      const parsed = JSON.parse(rootState);
      if (parsed[key]) {
        return JSON.parse(parsed[key]);
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Attach token and active company to every request
api.interceptors.request.use(
  (config) => {
    try {
      // Attach auth token
      const auth = getPersistedState('auth');
      if (auth?.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
      }

      // Attach active company ID — URL param takes priority, falls back to localStorage
      const companyId = getActiveCompanyId();
      if (companyId) {
        config.headers['X-Company-Id'] = companyId;
      }
    } catch {
      // Ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state and redirect to login
      try {
        localStorage.removeItem('persist:root');
      } catch {
        // Ignore
      }
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
