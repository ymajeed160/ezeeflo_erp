import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionPlanApi from '../../services/subscriptionPlanApi';

export const fetchPlans = createAsyncThunk('subscriptionPlans/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPlansWithModules = createAsyncThunk('subscriptionPlans/fetchWithModules', async (_, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.getAllWithModules();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPlan = createAsyncThunk('subscriptionPlans/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createPlan = createAsyncThunk('subscriptionPlans/create', async (data, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePlan = createAsyncThunk('subscriptionPlans/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deletePlan = createAsyncThunk('subscriptionPlans/delete', async (id, { rejectWithValue }) => {
  try {
    await subscriptionPlanApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const togglePlanStatus = createAsyncThunk('subscriptionPlans/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await subscriptionPlanApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const subscriptionPlanSlice = createSlice({
  name: 'subscriptionPlans',
  initialState: {
    items: [],
    selectedPlan: null,
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedPlan: (state) => { state.selectedPlan = null; },
    clearError: (state) => { state.error = null; },
    setPage: (state, action) => { state.page = action.payload; },
    setLimit: (state, action) => { state.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
      })
      .addCase(fetchPlans.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchPlansWithModules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPlansWithModules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.data?.length || 0;
      })
      .addCase(fetchPlansWithModules.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchPlan.fulfilled, (state, action) => { state.selectedPlan = action.payload.data; })
      .addCase(createPlan.pending, (state) => { state.loading = true; })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createPlan.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(p => p.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      .addCase(updatePlan.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
        state.total -= 1;
      })
      .addCase(togglePlanStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(p => p.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      });
  },
});

export const { clearSelectedPlan, clearError, setPage, setLimit } = subscriptionPlanSlice.actions;
export default subscriptionPlanSlice.reducer;
