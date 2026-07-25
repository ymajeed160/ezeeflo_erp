import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/bankReconciliationApi';

export const fetchReconciliations = createAsyncThunk('recon/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchReconciliation = createAsyncThunk('recon/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createReconciliation = createAsyncThunk('recon/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const importStatementLines = createAsyncThunk('recon/importLines', async ({ id, data }, { rejectWithValue }) => { try { return await api.importLines(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const manualMatch = createAsyncThunk('recon/manualMatch', async ({ id, lineId, bankTransactionId }, { rejectWithValue }) => { try { return await api.manualMatch(id, lineId, bankTransactionId); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const unmatchLine = createAsyncThunk('recon/unmatch', async ({ id, lineId }, { rejectWithValue }) => { try { return await api.unmatchLine(id, lineId); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const completeReconciliation = createAsyncThunk('recon/complete', async (id, { rejectWithValue }) => { try { return await api.complete(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const overrideCompleteReconciliation = createAsyncThunk('recon/override', async (id, { rejectWithValue }) => { try { return await api.overrideComplete(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const reverseReconciliation = createAsyncThunk('recon/reverse', async (id, { rejectWithValue }) => { try { return await api.reverse(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteReconciliation = createAsyncThunk('recon/delete', async (id, { rejectWithValue }) => { try { await api.delete(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'bankReconciliations',
  initialState: { reconciliations: [], selectedReconciliation: null, loading: false, error: null, total: 0, page: 1, pageSize: 10 },
  reducers: { clearSelected: (s) => { s.selectedReconciliation = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchReconciliations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchReconciliations.fulfilled, (s, a) => { s.loading = false; s.reconciliations = a.payload.data || a.payload; s.total = a.payload.meta?.pagination?.total || 0; s.page = a.payload.meta?.pagination?.page || 1; });
    b.addCase(fetchReconciliations.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchReconciliation.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchReconciliation.fulfilled, (s, a) => { s.loading = false; s.selectedReconciliation = a.payload.data || a.payload; });
    b.addCase(fetchReconciliation.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(createReconciliation.fulfilled, (s, a) => { s.reconciliations.unshift(a.payload.data || a.payload); });
    b.addCase(importStatementLines.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.reconciliations.findIndex((r) => r.id === u.id); if (idx !== -1) s.reconciliations[idx] = u; });
    b.addCase(manualMatch.fulfilled, (s, a) => { s.selectedReconciliation = a.payload.data || a.payload; });
    b.addCase(unmatchLine.fulfilled, (s, a) => { s.selectedReconciliation = a.payload.data || a.payload; });
    b.addCase(completeReconciliation.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.reconciliations.findIndex((r) => r.id === u.id); if (idx !== -1) s.reconciliations[idx] = u; });
    b.addCase(overrideCompleteReconciliation.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.reconciliations.findIndex((r) => r.id === u.id); if (idx !== -1) s.reconciliations[idx] = u; });
    b.addCase(reverseReconciliation.fulfilled, (s, a) => { const u = a.payload.data || a.payload; const idx = s.reconciliations.findIndex((r) => r.id === u.id); if (idx !== -1) s.reconciliations[idx] = u; });
    b.addCase(deleteReconciliation.fulfilled, (s, a) => { s.reconciliations = s.reconciliations.filter((r) => r.id !== a.payload); });
  },
});
export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
