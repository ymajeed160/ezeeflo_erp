import axios from 'axios';

const API_BASE = '/api/superadmin';

/**
 * Super Admin login
 */
export const login = async ({ email, password }) => {
  const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
  if (!data.success) throw new Error(data.message || 'Login failed');
  return data.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken) => {
  const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
  if (!data.success) throw new Error(data.message || 'Token refresh failed');
  return data.data;
};

/**
 * Get current super admin profile
 */
export const getMe = async (token) => {
  const { data } = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

/**
 * Logout
 */
export const logout = async (token) => {
  const { data } = await axios.post(`${API_BASE}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * Change password
 */
export const changePassword = async (token, { currentPassword, newPassword }) => {
  const { data } = await axios.put(`${API_BASE}/auth/change-password`, {
    currentPassword, newPassword,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * Get dashboard statistics
 */
export const getDashboard = async (token) => {
  const { data } = await axios.get(`${API_BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
};

// ── Interceptor for auto token refresh ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Set up axios interceptor for super admin API calls
axios.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const stored = localStorage.getItem('persist:sa_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.refreshToken) {
            const result = await refreshToken(parsed.refreshToken);
            // Update stored token
            parsed.accessToken = result.accessToken;
            parsed.refreshToken = result.refreshToken;
            localStorage.setItem('persist:sa_auth', JSON.stringify(parsed));
            processQueue(null, result.accessToken);
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            return axios(originalRequest);
          }
        } catch {
          processQueue(new Error('Refresh failed'));
          localStorage.removeItem('persist:sa_auth');
          window.location.href = '/superadmin/login';
        }
      }

      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);
