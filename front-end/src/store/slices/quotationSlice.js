import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import quotationApi from '../../services/quotationApi';
import { apiError, apiSuccess } from '../../utils/toast';

export const fetchQuotations = createAsyncThunk('quotations/fetchAll', async (params) => {
  const response = await quotationApi.getAll(params);
  return response.data;
});

export const fetchQuotation = createAsyncThunk('quotations/fetchById', async (id) => {
  const response = await quotationApi.getById(id);
  return response.data;
});

export const createQuotation = createAsyncThunk('quotations/create', async (data, { rejectWithValue }) => {
  try {
    const response = await quotationApi.create(data);
    apiSuccess('Quotation created successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to create quotation');
    return rejectWithValue(error.response?.data);
  }
});

export const updateQuotation = createAsyncThunk('quotations/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await quotationApi.update(id, data);
    apiSuccess('Quotation updated successfully');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to update quotation');
    return rejectWithValue(error.response?.data);
  }
});

export const deleteQuotation = createAsyncThunk('quotations/delete', async (id, { rejectWithValue }) => {
  try {
    await quotationApi.delete(id);
    apiSuccess('Quotation deleted successfully');
    return id;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to delete quotation');
    return rejectWithValue(error.response?.data);
  }
});

export const updateQuotationStatus = createAsyncThunk('quotations/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await quotationApi.updateStatus(id, status);
    apiSuccess('Quotation status updated');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to update status');
    return rejectWithValue(error.response?.data);
  }
});

export const approveQuotation = createAsyncThunk('quotations/approve', async (id, { rejectWithValue }) => {
  try {
    const response = await quotationApi.approve(id);
    apiSuccess('Quotation approved');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to approve quotation');
    return rejectWithValue(error.response?.data);
  }
});

export const rejectQuotation = createAsyncThunk('quotations/reject', async (id, { rejectWithValue }) => {
  try {
    const response = await quotationApi.reject(id);
    apiSuccess('Quotation rejected');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to reject quotation');
    return rejectWithValue(error.response?.data);
  }
});

export const convertQuotationToSalesOrder = createAsyncThunk('quotations/convertToSO', async (id, { rejectWithValue }) => {
  try {
    const response = await quotationApi.convertToSalesOrder(id);
    apiSuccess('Sales Order created from Quotation');
    return response.data;
  } catch (error) {
    apiError(error.response?.data?.message || 'Failed to convert quotation to sales order');
    return rejectWithValue(error.response?.data);
  }
});

const quotationSlice = createSlice({
  name: 'quotations',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 20,
    selectedQuotation: null,
    loading: false,
    error: null,
    submitting: false,
  },
  reducers: {
    clearSelectedQuotation: (state) => {
      state.selectedQuotation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchQuotations.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchQuotation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuotation.fulfilled, (state, action) => { state.loading = false; state.selectedQuotation = action.payload; })
      .addCase(fetchQuotation.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(createQuotation.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createQuotation.fulfilled, (state) => { state.submitting = false; })
      .addCase(createQuotation.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      .addCase(updateQuotation.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedQuotation = action.payload;
        const idx = state.list.findIndex((q) => q.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateQuotation.rejected, (state, action) => { state.submitting = false; state.error = action.payload?.message; })
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.list = state.list.filter((q) => q.id !== action.payload);
        state.total -= 1;
        if (state.selectedQuotation?.id === action.payload) state.selectedQuotation = null;
      })
      .addCase(updateQuotationStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        state.selectedQuotation = updated;
        const idx = state.list.findIndex((q) => q.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(approveQuotation.fulfilled, (state, action) => {
        const updated = action.payload;
        state.selectedQuotation = updated;
        const idx = state.list.findIndex((q) => q.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(rejectQuotation.fulfilled, (state, action) => {
        const updated = action.payload;
        state.selectedQuotation = updated;
        const idx = state.list.findIndex((q) => q.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      });
  },
});

export const { clearSelectedQuotation, clearError } = quotationSlice.actions;
export default quotationSlice.reducer;