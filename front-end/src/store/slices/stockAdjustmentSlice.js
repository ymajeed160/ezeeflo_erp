import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import stockAdjustmentApi from '../../services/stockAdjustmentApi';

export const fetchStockAdjustments = createAsyncThunk('stockAdjustments/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await stockAdjustmentApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchStockAdjustment = createAsyncThunk('stockAdjustments/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await stockAdjustmentApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createStockAdjustment = createAsyncThunk('stockAdjustments/create', async (data, { rejectWithValue }) => {
  try {
    const response = await stockAdjustmentApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateStockAdjustment = createAsyncThunk('stockAdjustments/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await stockAdjustmentApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const approveStockAdjustment = createAsyncThunk('stockAdjustments/approve', async (id, { rejectWithValue }) => {
  try {
    const response = await stockAdjustmentApi.approve(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteStockAdjustment = createAsyncThunk('stockAdjustments/delete', async (id, { rejectWithValue }) => {
  try {
    await stockAdjustmentApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const stockAdjustmentSlice = createSlice({
  name: 'stockAdjustments',
  initialState: {
    stockAdjustments: [],
    selectedItem: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    clearSelected: (state) => {
      state.selectedItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockAdjustments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStockAdjustments.fulfilled, (state, action) => {
        state.loading = false;
        state.stockAdjustments = action.payload.data || action.payload;
        state.total = action.payload.meta?.pagination?.total || action.payload.total || (action.payload.data?.length || 0);
      })
      .addCase(fetchStockAdjustments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStockAdjustment.pending, (state) => { state.loading = true; })
      .addCase(fetchStockAdjustment.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload.data || action.payload; })
      .addCase(fetchStockAdjustment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createStockAdjustment.fulfilled, (state, action) => { state.stockAdjustments.unshift(action.payload.data || action.payload); })
      .addCase(updateStockAdjustment.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockAdjustments.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockAdjustments[idx] = updated;
      })
      .addCase(approveStockAdjustment.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockAdjustments.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockAdjustments[idx] = updated;
      })
      .addCase(deleteStockAdjustment.fulfilled, (state, action) => {
        state.stockAdjustments = state.stockAdjustments.filter((i) => i.id !== action.payload);
      });
  },
});

export const { clearSelected, clearError } = stockAdjustmentSlice.actions;
export default stockAdjustmentSlice.reducer;