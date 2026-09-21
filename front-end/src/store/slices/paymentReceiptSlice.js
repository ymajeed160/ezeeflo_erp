import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentReceiptApi from '../../services/paymentReceiptApi';

export const fetchPaymentReceipts = createAsyncThunk('paymentReceipts/fetchAll', async (params, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.getAll(params); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchPaymentReceipt = createAsyncThunk('paymentReceipts/fetchById', async (id, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.getById(id); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchInvoicesForReceiptAllocation = createAsyncThunk('paymentReceipts/fetchInvoices', async ({ customerId, excludeReceiptId }, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.getInvoicesForAllocation(customerId, excludeReceiptId); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const createPaymentReceipt = createAsyncThunk('paymentReceipts/create', async (data, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.create(data); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updatePaymentReceipt = createAsyncThunk('paymentReceipts/update', async ({ id, data }, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.update(id, data); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const postPaymentReceipt = createAsyncThunk('paymentReceipts/post', async (id, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.post(id); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const reversePaymentReceipt = createAsyncThunk('paymentReceipts/reverse', async (id, { rejectWithValue }) => {
  try { const r = await paymentReceiptApi.reverse(id); return r; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const deletePaymentReceipt = createAsyncThunk('paymentReceipts/delete', async (id, { rejectWithValue }) => {
  try { await paymentReceiptApi.delete(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const paymentReceiptSlice = createSlice({
  name: 'paymentReceipts',
  initialState: { receipts: [], selectedReceipt: null, invoicesForAllocation: [], loading: false, error: null, total: 0, page: 1, pageSize: 10 },
  reducers: {
    clearSelected: (state) => { state.selectedReceipt = null; state.invoicesForAllocation = []; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentReceipts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPaymentReceipts.fulfilled, (s, a) => {
        s.loading = false; s.receipts = a.payload.data || a.payload;
        s.total = a.payload.meta?.pagination?.total || a.payload.total || 0;
        s.page = a.payload.meta?.pagination?.page || 1; s.pageSize = a.payload.meta?.pagination?.limit || 10;
      })
      .addCase(fetchPaymentReceipts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchPaymentReceipt.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPaymentReceipt.fulfilled, (s, a) => { s.loading = false; s.selectedReceipt = a.payload.data || a.payload; })
      .addCase(fetchPaymentReceipt.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchInvoicesForReceiptAllocation.fulfilled, (s, a) => { s.invoicesForAllocation = a.payload.data || a.payload; })
      .addCase(createPaymentReceipt.fulfilled, (s, a) => { s.receipts.unshift(a.payload.data || a.payload); })
      .addCase(updatePaymentReceipt.fulfilled, (s, a) => {
        const u = a.payload.data || a.payload; const idx = s.receipts.findIndex((r) => r.id === u.id);
        if (idx !== -1) s.receipts[idx] = u;
      })
      .addCase(postPaymentReceipt.fulfilled, (s, a) => {
        const u = a.payload.data || a.payload; const idx = s.receipts.findIndex((r) => r.id === u.id);
        if (idx !== -1) s.receipts[idx] = u;
      })
      .addCase(reversePaymentReceipt.fulfilled, (s, a) => {
        const u = a.payload.data || a.payload; const idx = s.receipts.findIndex((r) => r.id === u.id);
        if (idx !== -1) s.receipts[idx] = u;
      })
      .addCase(deletePaymentReceipt.fulfilled, (s, a) => { s.receipts = s.receipts.filter((r) => r.id !== a.payload); });
  },
});

export const { clearSelected, clearError } = paymentReceiptSlice.actions;
export default paymentReceiptSlice.reducer;
