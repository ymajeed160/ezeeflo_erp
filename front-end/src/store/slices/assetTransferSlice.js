import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetTransferApi from '../../services/assetTransferApi';

export const fetchTransfers = createAsyncThunk('assetTransfers/fetchAll', async (params, { rejectWithValue }) => {
  try { const r = await assetTransferApi.getAll(params); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});
export const fetchTransfer = createAsyncThunk('assetTransfers/fetchById', async (id, { rejectWithValue }) => {
  try { const r = await assetTransferApi.getById(id); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});
export const fetchNextTransferNumber = createAsyncThunk('assetTransfers/fetchNextNumber', async (_, { rejectWithValue }) => {
  try { const r = await assetTransferApi.getNextNumber(); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});
export const fetchTransfersByAsset = createAsyncThunk('assetTransfers/fetchByAsset', async (assetId, { rejectWithValue }) => {
  try { const r = await assetTransferApi.getByAsset(assetId); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});
export const createTransfer = createAsyncThunk('assetTransfers/create', async (data, { rejectWithValue }) => {
  try { const r = await assetTransferApi.create(data); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});
export const deleteTransfer = createAsyncThunk('assetTransfers/delete', async (id, { rejectWithValue }) => {
  try { await assetTransferApi.delete(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const slice = createSlice({
  name: 'assetTransfers',
  initialState: { transfers: [], selectedTransfer: null, nextTransferNumber: '', transferHistory: [], loading: false, error: null, total: 0, page: 1, pageSize: 10 },
  reducers: { clearSelected: (s) => { s.selectedTransfer = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchTransfers.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchTransfers.fulfilled, (s, a) => { s.loading = false; s.transfers = a.payload.data || []; if (a.payload.meta?.pagination) { s.total = a.payload.meta.pagination.total; s.page = a.payload.meta.pagination.page; s.pageSize = a.payload.meta.pagination.limit; } });
    b.addCase(fetchTransfers.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchTransfer.fulfilled, (s, a) => { s.selectedTransfer = a.payload.data; });
    b.addCase(fetchNextTransferNumber.fulfilled, (s, a) => { s.nextTransferNumber = a.payload.data?.nextTransferNumber || 'ATR-000001'; });
    b.addCase(fetchTransfersByAsset.fulfilled, (s, a) => { s.transferHistory = a.payload.data || []; });
    b.addCase(createTransfer.fulfilled, (s, a) => { s.transfers.unshift(a.payload.data); s.total += 1; });
    b.addCase(deleteTransfer.fulfilled, (s, a) => { s.transfers = s.transfers.filter((t) => t.id !== a.payload); s.total -= 1; });
  },
});

export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
