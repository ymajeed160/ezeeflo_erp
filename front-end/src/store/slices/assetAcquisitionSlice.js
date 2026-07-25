import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetAcquisitionApi from '../../services/assetAcquisitionApi';

export const fetchAcquisitions = createAsyncThunk(
  'assetAcquisitions/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAcquisition = createAsyncThunk(
  'assetAcquisitions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchNextAcquisitionNumber = createAsyncThunk(
  'assetAcquisitions/fetchNextNumber',
  async (_, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.getNextNumber();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAcquisition = createAsyncThunk(
  'assetAcquisitions/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const postAcquisition = createAsyncThunk(
  'assetAcquisitions/post',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.post(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reverseAcquisition = createAsyncThunk(
  'assetAcquisitions/reverse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await assetAcquisitionApi.reverse(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAcquisition = createAsyncThunk(
  'assetAcquisitions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await assetAcquisitionApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const assetAcquisitionSlice = createSlice({
  name: 'assetAcquisitions',
  initialState: {
    acquisitions: [],
    selectedAcquisition: null,
    nextAcquisitionNumber: '',
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    clearSelected: (state) => { state.selectedAcquisition = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAcquisitions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAcquisitions.fulfilled, (state, action) => {
        state.loading = false;
        state.acquisitions = action.payload.data || [];
        if (action.payload.meta?.pagination) {
          state.total = action.payload.meta.pagination.total;
          state.page = action.payload.meta.pagination.page;
          state.pageSize = action.payload.meta.pagination.limit;
        }
      })
      .addCase(fetchAcquisitions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAcquisition.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAcquisition.fulfilled, (state, action) => { state.loading = false; state.selectedAcquisition = action.payload.data; })
      .addCase(fetchAcquisition.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchNextAcquisitionNumber.fulfilled, (state, action) => {
        state.nextAcquisitionNumber = action.payload.data?.nextAcquisitionNumber || 'ACQ-000001';
      })
      .addCase(createAcquisition.fulfilled, (state, action) => {
        state.acquisitions.unshift(action.payload.data);
        state.total += 1;
      })
      .addCase(postAcquisition.fulfilled, (state, action) => {
        const idx = state.acquisitions.findIndex((a) => a.id === action.payload.data.id);
        if (idx !== -1) state.acquisitions[idx] = action.payload.data;
        state.selectedAcquisition = action.payload.data;
      })
      .addCase(reverseAcquisition.fulfilled, (state, action) => {
        const idx = state.acquisitions.findIndex((a) => a.id === action.payload.data.id);
        if (idx !== -1) state.acquisitions[idx] = action.payload.data;
        state.selectedAcquisition = action.payload.data;
      })
      .addCase(deleteAcquisition.fulfilled, (state, action) => {
        state.acquisitions = state.acquisitions.filter((a) => a.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearSelected, clearError } = assetAcquisitionSlice.actions;
export default assetAcquisitionSlice.reducer;
