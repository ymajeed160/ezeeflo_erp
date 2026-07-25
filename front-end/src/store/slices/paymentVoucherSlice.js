import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/paymentVoucherApi';

export const fetchPaymentVouchers = createAsyncThunk('paymentVouchers/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchPaymentVoucher = createAsyncThunk('paymentVouchers/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchInvoicesForVoucherAllocation = createAsyncThunk('paymentVouchers/fetchInvoices', async ({ supplierId, excludeVoucherId }, { rejectWithValue }) => { try { return await api.getInvoicesForAllocation(supplierId, excludeVoucherId); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createPaymentVoucher = createAsyncThunk('paymentVouchers/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updatePaymentVoucher = createAsyncThunk('paymentVouchers/update', async ({ id, data }, { rejectWithValue }) => { try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const postPaymentVoucher = createAsyncThunk('paymentVouchers/post', async (id, { rejectWithValue }) => { try { return await api.post(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const reversePaymentVoucher = createAsyncThunk('paymentVouchers/reverse', async (id, { rejectWithValue }) => { try { return await api.reverse(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deletePaymentVoucher = createAsyncThunk('paymentVouchers/delete', async (id, { rejectWithValue }) => { try { await api.delete(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'paymentVouchers',
  initialState: { vouchers: [], selectedVoucher: null, invoicesForAllocation: [], loading: false, error: null, total: 0, page: 1, pageSize: 10 },
  reducers: { clearSelected: (s) => { s.selectedVoucher = null; s.invoicesForAllocation = []; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchPaymentVouchers.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchPaymentVouchers.fulfilled, (s, a) => { s.loading = false; s.vouchers = a.payload.data || a.payload; s.total = a.payload.meta?.pagination?.total || a.payload.total || 0; s.page = a.payload.meta?.pagination?.page || 1; s.pageSize = a.payload.meta?.pagination?.limit || 10; });
    b.addCase(fetchPaymentVouchers.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchPaymentVoucher.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchPaymentVoucher.fulfilled, (s, a) => { s.loading = false; s.selectedVoucher = a.payload.data || a.payload; });
    b.addCase(fetchPaymentVoucher.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchInvoicesForVoucherAllocation.fulfilled, (s, a) => { s.invoicesForAllocation = a.payload.data || a.payload; });
    b.addCase(createPaymentVoucher.fulfilled, (s, a) => { s.vouchers.unshift(a.payload.data || a.payload); });
    b.addCase(updatePaymentVoucher.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.vouchers.findIndex((v) => v.id === u.id); if (idx !== -1) s.vouchers[idx] = u; });
    b.addCase(postPaymentVoucher.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.vouchers.findIndex((v) => v.id === u.id); if (idx !== -1) s.vouchers[idx] = u; });
    b.addCase(reversePaymentVoucher.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.vouchers.findIndex((v) => v.id === u.id); if (idx !== -1) s.vouchers[idx] = u; });
    b.addCase(deletePaymentVoucher.fulfilled, (s, a) => { s.vouchers = s.vouchers.filter((v) => v.id !== a.payload); });
  },
});
export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
