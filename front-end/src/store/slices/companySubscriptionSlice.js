import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import companySubscriptionApi from '../../services/companySubscriptionApi';

export const fetchDashboardStats = createAsyncThunk('companySubscriptions/fetchDashboardStats', async (_, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.getDashboardStats();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSubscriptions = createAsyncThunk('companySubscriptions/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSubscription = createAsyncThunk('companySubscriptions/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createSubscription = createAsyncThunk('companySubscriptions/create', async (data, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateSubscription = createAsyncThunk('companySubscriptions/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const cancelSubscription = createAsyncThunk('companySubscriptions/cancel', async (id, { rejectWithValue }) => {
  try {
    const response = await companySubscriptionApi.cancel(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const companySubscriptionSlice = createSlice({
  name: 'companySubscriptions',
  initialState: {
    items: [],
    selectedSubscription: null,
    dashboardStats: null,
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => { state.selectedSubscription = null; },
    clearError: (state) => { state.error = null; },
    setPage: (state, action) => { state.page = action.payload; },
    setLimit: (state, action) => { state.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload.data;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSubscription.pending, (state) => { state.loading = true; })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createSubscription.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const idx = state.items.findIndex(s => s.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        const idx = state.items.findIndex(s => s.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      });
  },
});

export const { clearSelected, clearError, setPage, setLimit } = companySubscriptionSlice.actions;
export default companySubscriptionSlice.reducer;
