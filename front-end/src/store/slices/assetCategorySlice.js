import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetCategoryApi from '../../services/assetCategoryApi';

export const fetchAssetCategories = createAsyncThunk(
  'assetCategories/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAssetCategory = createAsyncThunk(
  'assetCategories/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveAssetCategories = createAsyncThunk(
  'assetCategories/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.getActive();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAssetCategory = createAsyncThunk(
  'assetCategories/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAssetCategory = createAsyncThunk(
  'assetCategories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAssetCategory = createAsyncThunk(
  'assetCategories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await assetCategoryApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleAssetCategoryStatus = createAsyncThunk(
  'assetCategories/toggleStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetCategoryApi.toggleStatus(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const assetCategorySlice = createSlice({
  name: 'assetCategories',
  initialState: {
    assetCategories: [],
    selectedAssetCategory: null,
    activeAssetCategories: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedAssetCategory = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAssetCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.assetCategories = action.payload.data || [];
        if (action.payload.meta?.pagination) {
          state.total = action.payload.meta.pagination.total;
          state.page = action.payload.meta.pagination.page;
          state.pageSize = action.payload.meta.pagination.limit;
        }
      })
      .addCase(fetchAssetCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchById
      .addCase(fetchAssetCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAssetCategory = action.payload.data;
      })
      .addCase(fetchAssetCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchActive
      .addCase(fetchActiveAssetCategories.fulfilled, (state, action) => {
        state.activeAssetCategories = action.payload.data || [];
      })
      // create
      .addCase(createAssetCategory.fulfilled, (state, action) => {
        state.assetCategories.unshift(action.payload.data);
        state.total += 1;
      })
      // update
      .addCase(updateAssetCategory.fulfilled, (state, action) => {
        const index = state.assetCategories.findIndex((c) => c.id === action.payload.data.id);
        if (index !== -1) {
          state.assetCategories[index] = action.payload.data;
        }
        state.selectedAssetCategory = action.payload.data;
      })
      // delete
      .addCase(deleteAssetCategory.fulfilled, (state, action) => {
        state.assetCategories = state.assetCategories.filter((c) => c.id !== action.payload);
        state.total -= 1;
      })
      // toggleStatus
      .addCase(toggleAssetCategoryStatus.fulfilled, (state, action) => {
        const index = state.assetCategories.findIndex((c) => c.id === action.payload.data.id);
        if (index !== -1) {
          state.assetCategories[index] = action.payload.data;
        }
      });
  },
});

export const { clearSelected, clearError } = assetCategorySlice.actions;
export default assetCategorySlice.reducer;
