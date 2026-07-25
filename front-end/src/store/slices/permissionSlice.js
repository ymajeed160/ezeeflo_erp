import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import permissionApi from '../../services/permissionApi';

export const fetchPermissions = createAsyncThunk('permissions/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await permissionApi.getAll();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPermissionModules = createAsyncThunk('permissions/fetchModules', async (_, { rejectWithValue }) => {
  try {
    const response = await permissionApi.getModules();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const permissionSlice = createSlice({
  name: 'permissions',
  initialState: {
    items: [],
    modules: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
      })
      .addCase(fetchPermissions.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(fetchPermissionModules.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPermissionModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload.data || [];
      })
      .addCase(fetchPermissionModules.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; });
  },
});

export const { clearError } = permissionSlice.actions;
export default permissionSlice.reducer;