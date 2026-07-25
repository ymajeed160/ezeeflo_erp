import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import itemApi from '../../services/itemApi';

export const fetchItems = createAsyncThunk('items/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await itemApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchItem = createAsyncThunk('items/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await itemApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createItem = createAsyncThunk('items/create', async (data, { rejectWithValue }) => {
  try {
    const response = await itemApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await itemApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteItem = createAsyncThunk('items/delete', async (id, { rejectWithValue }) => {
  try {
    await itemApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleItemStatus = createAsyncThunk('items/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await itemApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const itemSlice = createSlice({
  name: 'items',
  initialState: {
    items: [],
    currentItem: null,
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentItem: (state) => {
      state.currentItem = null;
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
      .addCase(fetchItems.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.items = payload.data || payload.rows || [];
        state.total = payload.total || payload.count || 0;
        state.totalPages = payload.totalPages || Math.ceil((payload.total || payload.count || 0) / state.limit) || 1;
      })
      .addCase(fetchItems.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Fetch One
      .addCase(fetchItem.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItem.fulfilled, (state, action) => { state.loading = false; state.currentItem = action.payload.data; })
      .addCase(fetchItem.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Create
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createItem.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Update
      .addCase(updateItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.currentItem?.id === action.payload.data.id) state.currentItem = action.payload.data;
      })
      .addCase(updateItem.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Delete
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteItem.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Toggle Status
      .addCase(toggleItemStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      });
  },
});

export const { clearCurrentItem, clearError, setPage, setLimit } = itemSlice.actions;
export default itemSlice.reducer;