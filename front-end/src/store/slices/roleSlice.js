import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import roleApi from '../../services/roleApi';

export const fetchRoles = createAsyncThunk('roles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await roleApi.getAll();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchRole = createAsyncThunk('roles/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await roleApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createRole = createAsyncThunk('roles/create', async (data, { rejectWithValue }) => {
  try {
    const response = await roleApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateRole = createAsyncThunk('roles/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await roleApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteRole = createAsyncThunk('roles/delete', async (id, { rejectWithValue }) => {
  try {
    await roleApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const roleSlice = createSlice({
  name: 'roles',
  initialState: {
    items: [],
    selectedRole: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedRole: (state) => {
      state.selectedRole = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
      })
      .addCase(fetchRoles.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(fetchRole.pending, (state) => { state.loading = true; })
      .addCase(fetchRole.fulfilled, (state, action) => { state.loading = false; state.selectedRole = action.payload.data; })
      .addCase(fetchRole.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(createRole.pending, (state) => { state.loading = true; })
      .addCase(createRole.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload.data); })
      .addCase(createRole.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(r => r.id === action.payload.data.id);
        if (idx !== -1) {
          // Preserve Users association since update response doesn't include it
          const updated = action.payload.data;
          updated.Users = state.items[idx].Users || state.items[idx].users || [];
          state.items[idx] = updated;
        }
        if (state.selectedRole?.id === action.payload.data.id) {
          state.selectedRole = action.payload.data;
        }
      })
      .addCase(updateRole.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(r => r.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; });
  },
});

export const { clearSelectedRole, clearError } = roleSlice.actions;
export default roleSlice.reducer;