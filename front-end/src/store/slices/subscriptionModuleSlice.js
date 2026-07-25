import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionModuleApi from '../../services/subscriptionModuleApi';

export const fetchModules = createAsyncThunk('subscriptionModules/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await subscriptionModuleApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchActiveModules = createAsyncThunk('subscriptionModules/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const response = await subscriptionModuleApi.getActive();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchModule = createAsyncThunk('subscriptionModules/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await subscriptionModuleApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createModule = createAsyncThunk('subscriptionModules/create', async (data, { rejectWithValue }) => {
  try {
    const response = await subscriptionModuleApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateModule = createAsyncThunk('subscriptionModules/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await subscriptionModuleApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteModule = createAsyncThunk('subscriptionModules/delete', async (id, { rejectWithValue }) => {
  try {
    await subscriptionModuleApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const subscriptionModuleSlice = createSlice({
  name: 'subscriptionModules',
  initialState: {
    items: [],
    activeModules: [],
    selectedModule: null,
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedModule: (state) => { state.selectedModule = null; },
    clearError: (state) => { state.error = null; },
    setPage: (state, action) => { state.page = action.payload; },
    setLimit: (state, action) => { state.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.pagination?.total || action.payload.total || 0;
      })
      .addCase(fetchModules.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchActiveModules.fulfilled, (state, action) => {
        state.activeModules = action.payload.data || [];
      })
      .addCase(createModule.pending, (state) => { state.loading = true; })
      .addCase(createModule.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createModule.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(m => m.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      .addCase(updateModule.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.items = state.items.filter(m => m.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearSelectedModule, clearError, setPage, setLimit } = subscriptionModuleSlice.actions;
export default subscriptionModuleSlice.reducer;
