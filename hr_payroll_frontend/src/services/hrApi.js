import axios from 'axios';
import { getToken, getActiveCompanyId } from '../utils/auth';

const BASE_URL = process.env.REACT_APP_HR_API_URL || '/api/hr';

/**
 * Get HR auth token from HR's own Redux store (persist:hr_auth),
 * falling back to ERP token (persist:root) for SSO compatibility.
 */
const getHrToken = () => {
  try {
    const hrAuth = localStorage.getItem('persist:hr_auth');
    if (hrAuth) {
      const parsed = JSON.parse(hrAuth);
      if (parsed.accessToken) return parsed.accessToken;
    }
  } catch {}
  return getToken();
};

/**
 * Get company ID from HR auth store, falling back to ERP store.
 */
const getHrCompanyId = () => {
  try {
    const hrAuth = localStorage.getItem('persist:hr_auth');
    if (hrAuth) {
      const parsed = JSON.parse(hrAuth);
      if (parsed.activeCompanyId) return parsed.activeCompanyId;
    }
  } catch {}
  return getActiveCompanyId();
};

const hrApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

hrApi.interceptors.request.use(
  (config) => {
    const token = getHrToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const companyId = getHrCompanyId();
    if (companyId) {
      config.headers['X-Company-Id'] = companyId;
      config.params = { ...(config.params || {}), companyId };
    } else if (token) {
      // Has token but no company — force re-login to get proper auth state
      localStorage.removeItem('persist:hr_auth');
      window.location.replace('/login');
      return Promise.reject(new Error('No company selected'));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401/403 and missing company
hrApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      window.location.replace('/login');
    }
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || '';
      if (message.includes('HR & Payroll module is not enabled')) {
        window.location.replace('/app/dashboard');
      }
    }
    if (error.response?.status === 400) {
      const message = error.response?.data?.message || '';
      if (message.includes('Company ID is required')) {
        // Stale session without company — clear and redirect to login
        localStorage.removeItem('persist:hr_auth');
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default hrApi;
