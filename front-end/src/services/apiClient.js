import axios from 'axios';
import { getActiveCompanyId } from '../utils/auth';

// Base URL without trailing slash — individual resources add their own path
const BASE_URL = process.env.REACT_APP_BASE_URL || '';

const apiClient = axios.create({
  baseURL: BASE_URL,
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
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state and redirect to login
      try {
        localStorage.removeItem('persist:root');
      } catch {
        // Ignore
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
