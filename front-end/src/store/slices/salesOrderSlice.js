import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesOrderApi from '../../services/salesOrderApi';
import { apiError, apiSuccess } from '../../utils/toast';

export const fetchSalesOrders = createAsyncThunk('salesOrders/fetchAll', async (params) => {
  const response = await salesOrderApi.getAll(params);
  return response.data;
});

export const fetchSalesOrder = createAsyncThunk('salesOrders/fetchById', async (id) => {
  const response = await salesOrderApi.getById(id);
  return response.data;
});

export const createSalesOrder = createAsyncThunk('salesOrders/create', async (data, { rejectWithValue }) => {
  try {
    const response = await salesOrderApi.create(data);
    apiSuccess('Sales Order created successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to create sales order');
    return rejectWithValue(error.response?.data);
  }
});

export const updateSalesOrder = createAsyncThunk('salesOrders/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await salesOrderApi.update(id, data);
    apiSuccess('Sales Order updated successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to update sales order');
    return rejectWithValue(error.response?.data);
  }
});

export const deleteSalesOrder = createAsyncThunk('salesOrders/delete', async (id, { rejectWithValue }) => {
  try {
    await salesOrderApi.delete(id);
    apiSuccess('Sales Order deleted successfully');
    return id;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to delete sales order');
    return rejectWithValue(error.response?.data);
  }
});

export const approveSalesOrder = createAsyncThunk('salesOrders/approve', async (id, { rejectWithValue }) => {
  try {
    const response = await salesOrderApi.approve(id);
    apiSuccess('Sales Order approved');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to approve sales order');
    return rejectWithValue(error.response?.data);
  }
});

export const closeSalesOrder = createAsyncThunk('salesOrders/close', async (id, { rejectWithValue }) => {
  try {
    const response = await salesOrderApi.close(id);
    apiSuccess('Sales Order closed');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to close sales order');
    return rejectWithValue(error.response?.data);
  }
});

const salesOrderSlice = createSlice({
  name: 'salesOrders',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 20,
    selectedOrder: null,
    loading: false,
    error: null,
    submitting: false,
  },
  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchSalesOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      // Fetch single
      .addCase(fetchSalesOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSalesOrder.fulfilled, (state, action) => { state.loading = false; state.selectedOrder = action.payload.data; })
      .addCase(fetchSalesOrder.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      // Create
      .addCase(createSalesOrder.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createSalesOrder.fulfilled, (state) => { state.submitting = false; })
      .addCase(createSalesOrder.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      // Update
      .addCase(updateSalesOrder.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateSalesOrder.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedOrder = action.payload.data;
        const idx = state.list.findIndex((o) => o.id === action.payload.data.id);
        if (idx !== -1) state.list[idx] = action.payload.data;
      })
      .addCase(updateSalesOrder.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      // Delete
      .addCase(deleteSalesOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((o) => o.id !== action.payload);
        state.total -= 1;
        if (state.selectedOrder?.id === action.payload) state.selectedOrder = null;
      })
      // Approve
      .addCase(approveSalesOrder.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.selectedOrder = updated;
        const idx = state.list.findIndex((o) => o.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })
      // Close
      .addCase(closeSalesOrder.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.selectedOrder = updated;
        const idx = state.list.findIndex((o) => o.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      });
  },
});

export const { clearSelectedOrder, clearError } = salesOrderSlice.actions;
export default salesOrderSlice.reducer;