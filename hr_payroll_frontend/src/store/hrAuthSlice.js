import { createSlice } from '@reduxjs/toolkit';

const HR_AUTH_KEY = 'persist:hr_auth';

const loadState = () => {
  try {
    const raw = localStorage.getItem(HR_AUTH_KEY);
    return raw ? JSON.parse(raw) : { accessToken: null, refreshToken: null, user: null, tenants: [], activeCompanyId: null };
  } catch {
    return { accessToken: null, refreshToken: null, user: null, tenants: [], activeCompanyId: null };
  }
};

const saveState = (state) => {
  localStorage.setItem(HR_AUTH_KEY, JSON.stringify({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    user: state.user,
    tenants: state.tenants,
    activeCompanyId: state.activeCompanyId,
  }));
};

const hrAuthSlice = createSlice({
  name: 'hrAuth',
  initialState: loadState(),
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.tenants = action.payload.tenants || [];
      // Auto-select first tenant as company
      if (action.payload.tenants && action.payload.tenants.length > 0) {
        state.activeCompanyId = action.payload.tenants[0].id;
      }
      saveState(state);
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.tenants = [];
      state.activeCompanyId = null;
      saveState(state);
    },
  },
});

export const { setAuth, clearAuth } = hrAuthSlice.actions;
export default hrAuthSlice.reducer;
