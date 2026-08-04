/**
 * Auth API Service
 * 
 * Handles all authentication-related API calls.
 * Integrates with existing HR & Payroll backend auth endpoints.
 */

import api from '../services/apiClient';
import type { ApiResponse, LoginCredentials, AuthTokens, UserProfile, CompanyInfo } from '../types';

const AuthAPI = {
  /**
   * Login with credentials (username, email, or employee number + password)
   * Mirrors: POST /api/hr/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
    tenants: CompanyInfo[];
  }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current authenticated user profile
   * Mirrors: GET /api/hr/auth/me
   */
  getMe: async (): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Refresh JWT tokens
   * Mirrors: POST /api/hr/auth/refresh
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Change password
   * Mirrors: POST /api/hr/auth/change-password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  /**
   * Request password reset
   * Mirrors: POST /api/hr/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Logout and invalidate current session
   * Mirrors: POST /api/hr/auth/logout
   */
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Register device for push notifications
   * Mirrors: POST /api/hr/auth/register-device
   */
  registerDevice: async (deviceToken: string, deviceInfo: {
    platform: string;
    model: string;
    osVersion: string;
  }): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/register-device', {
      deviceToken,
      ...deviceInfo,
    });
    return response.data;
  },

  /**
   * Unregister device
   * Mirrors: POST /api/hr/auth/unregister-device
   */
  unregisterDevice: async (deviceToken: string): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/unregister-device', { deviceToken });
    return response.data;
  },
};

export default AuthAPI;
