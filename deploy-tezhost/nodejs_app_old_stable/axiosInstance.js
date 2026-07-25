import axios from 'axios';
import { getActiveCompanyId } from '../utils/auth';

const baseURL = process.env.REACT_APP_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach access token and active company
axiosInstance.interceptors.request.use(
  (config) => {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}');

    // Attach auth token
    if (state.auth) {
      const auth = JSON.parse(state.auth);
      if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
      }
    }

    // Attach active company ID — URL param takes priority, falls back to localStorage
    // Skip company context for super admin routes (they need all companies data)
    const isSuperAdminRoute = config.url && config.url.includes('/superadmin/');
    const companyId = getActiveCompanyId();
    if (companyId && !isSuperAdminRoute) {
      // Send via custom header (works on localhost)
      config.headers['X-Company-Id'] = companyId;
      // Also send as query param (proxy-safe — survives cPanel Apache proxying)
      config.params = {
        ...(config.params || {}),
        companyId: companyId,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getRefreshTokenFromStorage = () => {
  try {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}');
    if (state.auth) {
      const auth = JSON.parse(state.auth);
      return auth.refreshToken || null;
    }
    return null;
  } catch {
    return null;
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry logout requests - just clear auth and redirect
    if (originalRequest.url?.includes('/auth/logout')) {
      localStorage.removeItem('persist:root');
      window.location.replace('/login');
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenValue = getRefreshTokenFromStorage();

      if (!refreshTokenValue) {
        isRefreshing = false;
        // No refresh token available, redirect to login
        localStorage.removeItem('persist:root');
        window.location.replace('/login');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken: refreshTokenValue }, { withCredentials: true });
        const newToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken || refreshTokenValue;

        // Update localStorage
        const state = JSON.parse(localStorage.getItem('persist:root') || '{}');
        if (state.auth) {
          const auth = JSON.parse(state.auth);
          auth.accessToken = newToken;
          auth.refreshToken = newRefreshToken;
          state.auth = JSON.stringify(auth);
          localStorage.setItem('persist:root', JSON.stringify(state));
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth and redirect to login
        localStorage.removeItem('persist:root');
        window.location.replace('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;