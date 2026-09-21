import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import stockTransferApi from '../../services/stockTransferApi';

export const fetchStockTransfers = createAsyncThunk('stockTransfers/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.getAll(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchStockTransfer = createAsyncThunk('stockTransfers/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.getById(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createStockTransfer = createAsyncThunk('stockTransfers/create', async (data, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.create(data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateStockTransfer = createAsyncThunk('stockTransfers/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.update(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const approveStockTransfer = createAsyncThunk('stockTransfers/approve', async (id, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.approve(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const completeStockTransfer = createAsyncThunk('stockTransfers/complete', async (id, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.complete(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const cancelStockTransfer = createAsyncThunk('stockTransfers/cancel', async (id, { rejectWithValue }) => {
  try {
    const response = await stockTransferApi.cancel(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteStockTransfer = createAsyncThunk('stockTransfers/delete', async (id, { rejectWithValue }) => {
  try {
    await stockTransferApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const stockTransferSlice = createSlice({
  name: 'stockTransfers',
  initialState: {
    stockTransfers: [],
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
      .addCase(fetchStockTransfers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStockTransfers.fulfilled, (state, action) => {
        state.loading = false;
        state.stockTransfers = action.payload.data || action.payload;
        state.total = action.payload.meta?.pagination?.total || action.payload.total || (action.payload.data?.length || 0);
      })
      .addCase(fetchStockTransfers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStockTransfer.pending, (state) => { state.loading = true; })
      .addCase(fetchStockTransfer.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload.data || action.payload; })
      .addCase(fetchStockTransfer.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createStockTransfer.fulfilled, (state, action) => { state.stockTransfers.unshift(action.payload.data || action.payload); })
      .addCase(updateStockTransfer.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockTransfers.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockTransfers[idx] = updated;
      })
      .addCase(approveStockTransfer.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockTransfers.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockTransfers[idx] = updated;
      })
      .addCase(completeStockTransfer.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockTransfers.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockTransfers[idx] = updated;
      })
      .addCase(cancelStockTransfer.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        const idx = state.stockTransfers.findIndex((i) => i.id === updated.id);
        if (idx !== -1) state.stockTransfers[idx] = updated;
      })
      .addCase(deleteStockTransfer.fulfilled, (state, action) => {
        state.stockTransfers = state.stockTransfers.filter((i) => i.id !== action.payload);
      });
  },
});

export const { clearSelected, clearError } = stockTransferSlice.actions;
export default stockTransferSlice.reducer;