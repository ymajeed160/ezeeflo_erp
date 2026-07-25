import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supplierPaymentApi from '../../services/supplierPaymentApi';

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  currentItem: null,
  currentLoading: false,
  submitting: false,
};

export const fetchSupplierPayments = createAsyncThunk('supplierPayment/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.getAll(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch supplier payments');
  }
});

export const fetchSupplierPaymentById = createAsyncThunk('supplierPayment/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.getById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch supplier payment');
  }
});

export const createSupplierPayment = createAsyncThunk('supplierPayment/create', async (data, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.create(data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create supplier payment');
  }
});

export const updateSupplierPayment = createAsyncThunk('supplierPayment/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.update(id, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update supplier payment');
  }
});

export const deleteSupplierPayment = createAsyncThunk('supplierPayment/delete', async (id, { rejectWithValue }) => {
  try {
    await supplierPaymentApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete supplier payment');
  }
});

export const confirmSupplierPayment = createAsyncThunk('supplierPayment/confirm', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.confirm(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to confirm supplier payment');
  }
});

export const postToJournalSupplierPayment = createAsyncThunk('supplierPayment/postToJournal', async (id, { rejectWithValue }) => {
  try {
    const response = await supplierPaymentApi.postToJournal(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to post supplier payment to journal');
  }
});

const supplierPaymentSlice = createSlice({
  name: 'supplierPayment',
  initialState,
  reducers: {
    clearCurrent: (state) => { state.currentItem = null; state.currentLoading = false; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupplierPayments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSupplierPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data.rows;
        state.total = action.payload.data.count;
        state.page = action.payload.data.page;
        state.limit = action.payload.data.limit;
      })
      .addCase(fetchSupplierPayments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchSupplierPaymentById.pending, (state) => { state.currentLoading = true; state.error = null; })
      .addCase(fetchSupplierPaymentById.fulfilled, (state, action) => { state.currentLoading = false; state.currentItem = action.payload; })
      .addCase(fetchSupplierPaymentById.rejected, (state, action) => { state.currentLoading = false; state.error = action.payload; })

      .addCase(createSupplierPayment.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createSupplierPayment.fulfilled, (state) => { state.submitting = false; })
      .addCase(createSupplierPayment.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(updateSupplierPayment.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateSupplierPayment.fulfilled, (state) => { state.submitting = false; })
      .addCase(updateSupplierPayment.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(deleteSupplierPayment.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(deleteSupplierPayment.fulfilled, (state, action) => {
        state.submitting = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteSupplierPayment.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(confirmSupplierPayment.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(confirmSupplierPayment.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(confirmSupplierPayment.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(postToJournalSupplierPayment.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(postToJournalSupplierPayment.fulfilled, (state, action) => {
        state.submitting = false;
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) state.currentItem = action.payload;
      })
      .addCase(postToJournalSupplierPayment.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
  }
});

export const { clearCurrent, clearError } = supplierPaymentSlice.actions;
export default supplierPaymentSlice.reducer;