import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetApi from '../../services/assetApi';

export const fetchAssets = createAsyncThunk(
  'assets/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await assetApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAsset = createAsyncThunk(
  'assets/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveAssets = createAsyncThunk(
  'assets/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await assetApi.getActive();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchNextAssetCode = createAsyncThunk(
  'assets/fetchNextCode',
  async (_, { rejectWithValue }) => {
    try {
      const response = await assetApi.getNextCode();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAsset = createAsyncThunk(
  'assets/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await assetApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAsset = createAsyncThunk(
  'assets/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await assetApi.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAssetStatus = createAsyncThunk(
  'assets/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await assetApi.updateStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAsset = createAsyncThunk(
  'assets/delete',
  async (id, { rejectWithValue }) => {
    try {
      await assetApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const assetSlice = createSlice({
  name: 'assets',
  initialState: {
    assets: [],
    selectedAsset: null,
    activeAssets: [],
    nextAssetCode: '',
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedAsset = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload.data || [];
        if (action.payload.meta?.pagination) {
          state.total = action.payload.meta.pagination.total;
          state.page = action.payload.meta.pagination.page;
          state.pageSize = action.payload.meta.pagination.limit;
        }
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchById
      .addCase(fetchAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAsset = action.payload.data;
      })
      .addCase(fetchAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchActive
      .addCase(fetchActiveAssets.fulfilled, (state, action) => {
        state.activeAssets = action.payload.data || [];
      })
      // fetchNextCode
      .addCase(fetchNextAssetCode.fulfilled, (state, action) => {
        state.nextAssetCode = action.payload.data?.nextAssetCode || 'AST-000001';
      })
      // create
      .addCase(createAsset.fulfilled, (state, action) => {
        state.assets.unshift(action.payload.data);
        state.total += 1;
      })
      // update
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.assets.findIndex((a) => a.id === action.payload.data.id);
        if (index !== -1) {
          state.assets[index] = action.payload.data;
        }
        state.selectedAsset = action.payload.data;
      })
      // updateStatus
      .addCase(updateAssetStatus.fulfilled, (state, action) => {
        const index = state.assets.findIndex((a) => a.id === action.payload.data.id);
        if (index !== -1) {
          state.assets[index] = action.payload.data;
        }
        state.selectedAsset = action.payload.data;
      })
      // delete
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.assets = state.assets.filter((a) => a.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearSelected, clearError } = assetSlice.actions;
export default assetSlice.reducer;
