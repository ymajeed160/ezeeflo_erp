import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import accountApi from '../../services/accountApi';

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await accountApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAccountTree = createAsyncThunk('accounts/fetchTree', async (_, { rejectWithValue }) => {
  try {
    const response = await accountApi.getTree();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchRootAccounts = createAsyncThunk('accounts/fetchRoots', async (_, { rejectWithValue }) => {
  try {
    const response = await accountApi.getRoots();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAccount = createAsyncThunk('accounts/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await accountApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAccountsByType = createAsyncThunk('accounts/fetchByType', async (type, { rejectWithValue }) => {
  try {
    const response = await accountApi.getByType(type);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchChildAccounts = createAsyncThunk('accounts/fetchChildren', async (parentId, { rejectWithValue }) => {
  try {
    const response = await accountApi.getChildren(parentId);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createAccount = createAsyncThunk('accounts/create', async (data, { rejectWithValue }) => {
  try {
    const response = await accountApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await accountApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteAccount = createAsyncThunk('accounts/delete', async (id, { rejectWithValue }) => {
  try {
    await accountApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleAccountStatus = createAsyncThunk('accounts/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await accountApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAccountSelect = createAsyncThunk('accounts/fetchSelect', async (_, { rejectWithValue }) => {
  try {
    const response = await accountApi.getAll({ pageSize: 999 });
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const accountSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: [],
    tree: null,
    roots: [],
    selectedAccount: null,
    accountSelect: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedAccount: (state) => {
      state.selectedAccount = null;
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
      // Fetch All
      .addCase(fetchAccounts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchAccounts.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Fetch Tree
      .addCase(fetchAccountTree.pending, (state) => { state.loading = true; })
      .addCase(fetchAccountTree.fulfilled, (state, action) => { state.loading = false; state.tree = action.payload.data; })
      .addCase(fetchAccountTree.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Fetch Roots
      .addCase(fetchRootAccounts.fulfilled, (state, action) => { state.roots = action.payload.data || []; })
      // Fetch One
      .addCase(fetchAccount.fulfilled, (state, action) => { state.selectedAccount = action.payload.data; })
      // Fetch Children
      .addCase(fetchChildAccounts.fulfilled, (state, action) => { state.items = action.payload.data || []; })
      // Create
      .addCase(createAccount.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createAccount.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Update
      .addCase(updateAccount.fulfilled, (state, action) => {
        const idx = state.items.findIndex(a => a.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedAccount?.id === action.payload.data.id) state.selectedAccount = action.payload.data;
      })
      .addCase(updateAccount.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Delete
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.items = state.items.filter(a => a.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteAccount.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Toggle Status
      .addCase(toggleAccountStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(a => a.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      })
      // Fetch Select
      .addCase(fetchAccountSelect.pending, (state) => { state.loading = true; })
      .addCase(fetchAccountSelect.fulfilled, (state, action) => {
        state.loading = false;
        state.accountSelect = action.payload.data || [];
      })
      .addCase(fetchAccountSelect.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; });
  },
});

export const { clearSelectedAccount, clearError, setPage, setLimit } = accountSlice.actions;
export default accountSlice.reducer;