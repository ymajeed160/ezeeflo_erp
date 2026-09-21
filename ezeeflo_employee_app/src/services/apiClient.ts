/**
 * API Client
 * 
 * Centralized Axios-based HTTP client for all API communication.
 * 
 * Features:
 * - JWT token injection
 * - Company context (X-Company-Id header)
 * - Automatic token refresh
 * - Request/response interceptors
 * - Error normalization
 * - Retry logic
 * - Offline detection
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Config from '../config';
import SecureStorage from './SecureStorage';
import type { ApiResponse, AuthTokens } from '../types';

// ── Token Management ──
let accessToken: string | null = null;
let refreshToken: string | null = null;
let activeCompanyId: string | null = null;

// ── Token Callbacks ──
let onTokenExpired: (() => Promise<void>) | null = null;
let onRefreshToken: ((refreshToken: string) => Promise<AuthTokens>) | null = null;

export const setTokenCallbacks = (
  expiredCallback: () => Promise<void>,
  refreshCallback: (rt: string) => Promise<AuthTokens>
) => {
  onTokenExpired = expiredCallback;
  onRefreshToken = refreshCallback;
};

export const setTokens = (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;
};

// Also lazy-load tokens from storage if not in memory
const ensureTokens = async () => {
  if (!accessToken) {
    accessToken = await SecureStorage.getItem(Config.AUTH.TOKEN_KEY);
    refreshToken = await SecureStorage.getItem(Config.AUTH.REFRESH_TOKEN_KEY);
  }
  if (!activeCompanyId) {
    activeCompanyId = await SecureStorage.getItem(Config.COMPANY.COMPANY_ID_KEY);
  }
};

export const setActiveCompany = (companyId: string | null) => {
  activeCompanyId = companyId;
};

// ── Create Axios Instance ──
const apiClient: AxiosInstance = axios.create({
  baseURL: `${Config.API.BASE_URL}${Config.API.HR_PREFIX}`,
  timeout: Config.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request Interceptor ──
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ensure tokens and company ID are loaded from storage
    await ensureTokens();

    // Inject JWT token
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Inject company context
    if (activeCompanyId && config.headers) {
      config.headers['X-Company-Id'] = activeCompanyId;
    }

    // Add device info
    if (config.headers) {
      config.headers['X-Client-Type'] = 'mobile';
      config.headers['X-Client-Version'] = '1.0.0';
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(normalizeError(error));
  }
);

// ── Response Interceptor ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while token refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: unknown) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (refreshToken && onRefreshToken) {
          const newTokens = await onRefreshToken(refreshToken);
          accessToken = newTokens.accessToken;
          refreshToken = newTokens.refreshToken;

          // Update the stored tokens
          await SecureStorage.setItem(Config.AUTH.TOKEN_KEY, newTokens.accessToken);
          await SecureStorage.setItem(Config.AUTH.REFRESH_TOKEN_KEY, newTokens.refreshToken);

          // Update header on original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }

          processQueue(null, newTokens.accessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        // Force logout
        if (onTokenExpired) {
          await onTokenExpired();
        }
        return Promise.reject(normalizeError(refreshError as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden — RBAC/Permission denied
    if (error.response?.status === 403) {
      console.warn('Access denied — insufficient permissions');
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }

    return Promise.reject(normalizeError(error));
  }
);

// ── Error Normalization ──
const normalizeError = (error: AxiosError<ApiResponse>): any => {
  if (error.response?.data) {
    return {
      success: false,
      message: error.response.data.message || 'An unexpected error occurred.',
      errors: error.response.data.errors || [],
      statusCode: error.response.status,
    };
  }

  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: error.response?.status || 0,
  };
};

// ── Convenience Methods ──
const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.get<ApiResponse<T>>(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post<ApiResponse<T>>(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put<ApiResponse<T>>(url, data, config);
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch<ApiResponse<T>>(url, data, config);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete<ApiResponse<T>>(url, config);
  },

  upload: <T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  // Token management
  setTokens,
  setActiveCompany,
  setTokenCallbacks,

  // Access to raw instance
  instance: apiClient,
};

export default api;
