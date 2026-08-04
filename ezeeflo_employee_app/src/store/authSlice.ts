/**
 * Auth Redux Slice
 * 
 * Manages authentication state: tokens, user, company, session.
 * Persists auth data to secure storage.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AuthAPI from '../api/authApi';
import SecureStorage from '../services/SecureStorage';
import Config from '../config';
import { setTokens, setActiveCompany, setTokenCallbacks } from '../services/apiClient';
import type { AuthState, LoginCredentials, UserProfile, CompanyInfo, AuthTokens } from '../types';

// ── Initial State ──
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  activeCompany: null,
  companies: [],
  isLoading: false,
  isBiometricEnabled: false,
  rememberMe: false,
  lastActivity: null,
};

// ── Async Thunks ──

/**
 * Login with credentials
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.login(credentials);
      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Login failed');
      }

      const { accessToken, refreshToken, user, tenants } = response.data;

      // Store tokens in secure storage
      await SecureStorage.setItem(Config.AUTH.TOKEN_KEY, accessToken);
      await SecureStorage.setItem(Config.AUTH.REFRESH_TOKEN_KEY, refreshToken);
      await SecureStorage.setObject(Config.AUTH.USER_KEY, user);

      if (credentials.rememberMe) {
        await SecureStorage.setItem(Config.AUTH.REMEMBER_ME_KEY, 'true');
      }

      // Update API client tokens
      setTokens(accessToken, refreshToken);

      return {
        tokens: { accessToken, refreshToken },
        user,
        companies: tenants || [],
        rememberMe: !!credentials.rememberMe,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed. Please try again.');
    }
  }
);

/**
 * Restore session from stored tokens
 */
export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await SecureStorage.getItem(Config.AUTH.TOKEN_KEY);
      const refreshToken = await SecureStorage.getItem(Config.AUTH.REFRESH_TOKEN_KEY);
      const rememberMe = await SecureStorage.getItem(Config.AUTH.REMEMBER_ME_KEY);
      const storedCompanyId = await SecureStorage.getItem(Config.COMPANY.COMPANY_ID_KEY);
      const storedCompany = await SecureStorage.getObject<CompanyInfo>(Config.COMPANY.COMPANY_DATA_KEY);

      if (!accessToken) {
        return rejectWithValue('No stored session');
      }

      // Validate token by calling /me
      setTokens(accessToken, refreshToken);
      const meResponse = await AuthAPI.getMe();

      if (!meResponse.success || !meResponse.data) {
        // Try to refresh
        if (refreshToken) {
          const refreshResponse = await AuthAPI.refreshToken(refreshToken);
          if (refreshResponse.success && refreshResponse.data) {
            const newTokens = refreshResponse.data;
            setTokens(newTokens.accessToken, newTokens.refreshToken);
            await SecureStorage.setItem(Config.AUTH.TOKEN_KEY, newTokens.accessToken);
            await SecureStorage.setItem(Config.AUTH.REFRESH_TOKEN_KEY, newTokens.refreshToken);

            const retryMe = await AuthAPI.getMe();
            if (retryMe.success && retryMe.data) {
              if (storedCompanyId) setActiveCompany(storedCompanyId);
              return {
                tokens: newTokens,
                user: retryMe.data,
                companies: storedCompany ? [storedCompany] : [],
                activeCompany: storedCompany || null,
                rememberMe: rememberMe === 'true',
              };
            }
          }
        }
        return rejectWithValue('Session expired');
      }

      if (storedCompanyId) setActiveCompany(storedCompanyId);
      return {
        tokens: { accessToken, refreshToken: refreshToken || '' },
        user: meResponse.data,
        companies: storedCompany ? [storedCompany] : [],
        activeCompany: storedCompany || null,
        rememberMe: rememberMe === 'true',
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Session restore failed');
    }
  }
);

/**
 * Refresh tokens
 */
export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (currentRefreshToken: string, { rejectWithValue }) => {
    try {
      const response = await AuthAPI.refreshToken(currentRefreshToken);
      if (!response.success || !response.data) {
        return rejectWithValue('Token refresh failed');
      }

      await SecureStorage.setItem(Config.AUTH.TOKEN_KEY, response.data.accessToken);
      await SecureStorage.setItem(Config.AUTH.REFRESH_TOKEN_KEY, response.data.refreshToken);
      setTokens(response.data.accessToken, response.data.refreshToken);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

/**
 * Logout
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthAPI.logout().catch(() => {}); // Fire and forget
    } finally {
      // Always clear local state
      await SecureStorage.removeItem(Config.AUTH.TOKEN_KEY);
      await SecureStorage.removeItem(Config.AUTH.REFRESH_TOKEN_KEY);
      await SecureStorage.removeItem(Config.AUTH.USER_KEY);
      await SecureStorage.removeItem(Config.AUTH.BIOMETRIC_KEY);
      await SecureStorage.removeItem(Config.COMPANY.COMPANY_ID_KEY);
      await SecureStorage.removeItem(Config.COMPANY.COMPANY_DATA_KEY);
      setTokens(null, null);
      setActiveCompany(null);
    }
    return undefined;
  }
);

// ── Slice ──
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Select active company
     */
    selectCompany: (state, action: PayloadAction<CompanyInfo>) => {
      state.activeCompany = action.payload;
      setActiveCompany(action.payload.id);
      SecureStorage.setItem(Config.COMPANY.COMPANY_ID_KEY, action.payload.id);
      SecureStorage.setObject(Config.COMPANY.COMPANY_DATA_KEY, action.payload);
    },

    /**
     * Enable/disable biometric login
     */
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.isBiometricEnabled = action.payload;
      SecureStorage.setItem(Config.AUTH.BIOMETRIC_KEY, String(action.payload));
    },

    /**
     * Update user profile
     */
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        SecureStorage.setObject(Config.AUTH.USER_KEY, state.user);
      }
    },

    /**
     * Update last activity timestamp
     */
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },

    /**
     * Reset auth state (used after logout)
     */
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.companies = action.payload.companies;
        state.rememberMe = action.payload.rememberMe;
        state.lastActivity = Date.now();
      })
      .addCase(loginThunk.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Restore Session
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.companies = action.payload.companies;
        state.activeCompany = action.payload.activeCompany;
        state.rememberMe = action.payload.rememberMe;
        state.lastActivity = Date.now();
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.lastActivity = Date.now();
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        // Session expired — force logout
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      });

    // Logout
    builder
      .addCase(logoutThunk.fulfilled, () => initialState);
  },
});

export const {
  selectCompany,
  setBiometricEnabled,
  updateUserProfile,
  updateLastActivity,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer;
