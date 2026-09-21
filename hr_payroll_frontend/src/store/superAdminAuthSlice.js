import { createSlice } from '@reduxjs/toolkit';

const SA_AUTH_KEY = 'persist:sa_auth';

const loadState = () => {
  try {
    const raw = localStorage.getItem(SA_AUTH_KEY);
    return raw ? JSON.parse(raw) : {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
  }
};

const saveState = (state) => {
  localStorage.setItem(SA_AUTH_KEY, JSON.stringify({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));
};

const superAdminAuthSlice = createSlice({
  name: 'superAdminAuth',
  initialState: loadState(),
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      saveState(state);
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      saveState(state);
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      saveState(state);
    },
  },
});

export const { setAuth, clearAuth, updateUser } = superAdminAuthSlice.actions;
export default superAdminAuthSlice.reducer;
