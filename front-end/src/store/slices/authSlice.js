import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../services/authApi';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (refreshTokenValue, { rejectWithValue }) => {
  try {
    await authApi.logout(refreshTokenValue);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const refreshToken = createAsyncThunk('auth/refreshToken', async (refreshTokenValue, { rejectWithValue }) => {
  try {
    const response = await authApi.refreshToken(refreshTokenValue);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Token refresh failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    companies: [],
    defaultCompanyId: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      if (action.payload.companies) {
        state.companies = action.payload.companies;
      }
      if (action.payload.defaultCompanyId) {
        state.defaultCompanyId = action.payload.defaultCompanyId;
      }
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setCompanies: (state, action) => {
      state.companies = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.companies = [];
      state.defaultCompanyId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.companies = action.payload.companies || [];
        state.defaultCompanyId = action.payload.defaultCompanyId || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.companies = [];
        state.defaultCompanyId = null;
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setCredentials, setUser, setCompanies, clearAuth } = authSlice.actions;
export default authSlice.reducer;