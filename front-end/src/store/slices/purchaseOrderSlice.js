import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchaseOrderApi from '../../services/purchaseOrderApi';
import { apiError, apiSuccess } from '../../utils/toast';

export const fetchPurchaseOrders = createAsyncThunk('purchaseOrders/fetchAll', async (params) => {
  const response = await purchaseOrderApi.getAll(params);
  return response.data;
});

export const fetchPurchaseOrder = createAsyncThunk('purchaseOrders/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderApi.getById(id);
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to fetch purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const createPurchaseOrder = createAsyncThunk('purchaseOrders/create', async (data, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderApi.create(data);
    apiSuccess('Purchase Order created successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to create purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const generateFromPR = createAsyncThunk('purchaseOrders/generateFromPR', async (data, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderApi.generateFromPR(data);
    apiSuccess('Purchase Order generated from Purchase Request');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to generate purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const updatePurchaseOrder = createAsyncThunk('purchaseOrders/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderApi.update(id, data);
    apiSuccess('Purchase Order updated successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to update purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const deletePurchaseOrder = createAsyncThunk('purchaseOrders/delete', async (id, { rejectWithValue }) => {
  try {
    await purchaseOrderApi.delete(id);
    apiSuccess('Purchase Order deleted successfully');
    return id;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to delete purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const approvePurchaseOrder = createAsyncThunk('purchaseOrders/approve', async ({ id, decision }, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderApi.approve(id, { decision });
    apiSuccess(`Purchase Order ${decision}`);
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to approve purchase order');
    return rejectWithValue(error.response?.data);
  }
});

export const fetchOutstandingPOs = createAsyncThunk('purchaseOrders/fetchOutstanding', async (params) => {
  const response = await purchaseOrderApi.getOutstanding(params);
  return response.data;
});

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrders',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 20,
    selectedOrder: null,
    outstanding: [],
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
      .addCase(fetchPurchaseOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data.rows || action.payload.data;
        state.total = action.payload.data.total || action.payload.total;
        state.page = action.payload.data.page || action.payload.page;
        state.limit = action.payload.data.limit || action.payload.limit;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      // Fetch single
      .addCase(fetchPurchaseOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPurchaseOrder.fulfilled, (state, action) => { state.loading = false; state.selectedOrder = action.payload.data; })
      .addCase(fetchPurchaseOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message || action.error?.message; })
      // Create
      .addCase(createPurchaseOrder.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createPurchaseOrder.fulfilled, (state) => { state.submitting = false; })
      .addCase(createPurchaseOrder.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      // Generate from PR
      .addCase(generateFromPR.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(generateFromPR.fulfilled, (state) => { state.submitting = false; })
      .addCase(generateFromPR.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      // Update
      .addCase(updatePurchaseOrder.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedOrder = action.payload.data;
        const idx = state.list.findIndex((o) => o.id === action.payload.data.id);
        if (idx !== -1) state.list[idx] = action.payload.data;
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      // Delete
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((o) => o.id !== action.payload);
        state.total -= 1;
        if (state.selectedOrder?.id === action.payload) state.selectedOrder = null;
      })
      // Approve
      .addCase(approvePurchaseOrder.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.selectedOrder = updated;
        const idx = state.list.findIndex((o) => o.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })
      // Fetch Outstanding
      .addCase(fetchOutstandingPOs.fulfilled, (state, action) => {
        state.outstanding = action.payload.data;
      });
  },
});

export const { clearSelectedOrder, clearError } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;