import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DashboardApi from '../../services/dashboardApi';

export const fetchDashboardSummary = createAsyncThunk(
  'hrDashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await DashboardApi.getSummary();
      return response.data?.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'hrDashboard',
  initialState: {
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboard: (state) => {
      state.summary = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
