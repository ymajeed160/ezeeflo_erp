import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userApi from '../../services/userApi';

export const fetchUsers = createAsyncThunk('users/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await userApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchUser = createAsyncThunk('users/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await userApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try {
    const response = await userApi.create(data);
    return response;
  } catch (error) {
    const errData = error.response?.data;
    if (errData?.errors?.length > 0) {
      const fieldMessages = errData.errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
      return rejectWithValue(`${errData.message}\n${fieldMessages}`);
    }
    return rejectWithValue(errData?.message || error.message);
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await userApi.update(id, data);
    return response;
  } catch (error) {
    const errData = error.response?.data;
    if (errData?.errors?.length > 0) {
      const fieldMessages = errData.errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
      return rejectWithValue(`${errData.message}\n${fieldMessages}`);
    }
    return rejectWithValue(errData?.message || error.message);
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await userApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleUserStatus = createAsyncThunk('users/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await userApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    selectedUser: null,
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.pagination?.total || action.payload.total || 0;
      })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(fetchUser.pending, (state) => { state.loading = true; })
      .addCase(fetchUser.fulfilled, (state, action) => { state.loading = false; state.selectedUser = action.payload.data; })
      .addCase(fetchUser.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(createUser.pending, (state) => { state.loading = true; })
      .addCase(createUser.fulfilled, (state, action) => { state.loading = false; state.items.unshift(action.payload.data); state.total += 1; })
      .addCase(createUser.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      .addCase(updateUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(u => u.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedUser?.id === action.payload.data.id) state.selectedUser = action.payload.data;
      })
      .addCase(updateUser.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Update failed'; })
      .addCase(deleteUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(u => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteUser.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Delete failed'; })
      .addCase(toggleUserStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(u => u.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      .addCase(toggleUserStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Status toggle failed'; });
  },
});

export const { clearSelectedUser, clearError, setPage, setLimit } = userSlice.actions;
export default userSlice.reducer;