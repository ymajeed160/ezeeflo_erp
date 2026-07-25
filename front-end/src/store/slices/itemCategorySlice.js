import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import itemCategoryApi from '../../services/itemCategoryApi';

export const fetchItemCategories = createAsyncThunk('itemCategories/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchItemCategoryTree = createAsyncThunk('itemCategories/fetchTree', async (_, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.getTree();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchRootItemCategories = createAsyncThunk('itemCategories/fetchRoots', async (_, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.getRoots();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchItemCategory = createAsyncThunk('itemCategories/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchChildItemCategories = createAsyncThunk('itemCategories/fetchChildren', async (parentId, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.getChildren(parentId);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createItemCategory = createAsyncThunk('itemCategories/create', async (data, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateItemCategory = createAsyncThunk('itemCategories/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteItemCategory = createAsyncThunk('itemCategories/delete', async (id, { rejectWithValue }) => {
  try {
    await itemCategoryApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const toggleItemCategoryStatus = createAsyncThunk('itemCategories/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const response = await itemCategoryApi.toggleStatus(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const itemCategorySlice = createSlice({
  name: 'itemCategories',
  initialState: {
    items: [],
    tree: null,
    roots: [],
    selectedCategory: null,
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
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
      .addCase(fetchItemCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItemCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchItemCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Fetch Tree
      .addCase(fetchItemCategoryTree.pending, (state) => { state.loading = true; })
      .addCase(fetchItemCategoryTree.fulfilled, (state, action) => { state.loading = false; state.tree = action.payload.data; })
      .addCase(fetchItemCategoryTree.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Fetch Roots
      .addCase(fetchRootItemCategories.fulfilled, (state, action) => { state.roots = action.payload.data || []; })
      // Fetch One
      .addCase(fetchItemCategory.fulfilled, (state, action) => { state.selectedCategory = action.payload.data; })
      // Fetch Children
      .addCase(fetchChildItemCategories.fulfilled, (state, action) => { state.items = action.payload.data || []; })
      // Create
      .addCase(createItemCategory.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(createItemCategory.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Update
      .addCase(updateItemCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
        if (state.selectedCategory?.id === action.payload.data.id) state.selectedCategory = action.payload.data;
      })
      .addCase(updateItemCategory.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Delete
      .addCase(deleteItemCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteItemCategory.rejected, (state, action) => { state.error = action.payload?.message || action.payload || 'Something went wrong'; })
      // Toggle Status
      .addCase(toggleItemCategoryStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.data.id);
        if (idx !== -1) state.items[idx] = action.payload.data;
      });
  },
});

export const { clearSelectedCategory, clearError, setPage, setLimit } = itemCategorySlice.actions;
export default itemCategorySlice.reducer;