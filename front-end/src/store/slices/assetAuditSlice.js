import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; import api from '../../services/assetAuditApi';
export const fetchAudits = createAsyncThunk('audits/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchAudit = createAsyncThunk('audits/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextAuditNumber = createAsyncThunk('audits/fetchNextNumber', async (_, { rejectWithValue }) => { try { return await api.getNextNumber(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createAudit = createAsyncThunk('audits/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteAudit = createAsyncThunk('audits/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
const slice = createSlice({
  name: 'audits', initialState: { audits: [], selectedAudit: null, nextAuditNumber: '', loading: false, error: null, total: 0 },
  reducers: { clearSelected: (s) => { s.selectedAudit = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchAudits.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchAudits.fulfilled, (s, a) => { s.loading = false; s.audits = a.payload.data || []; if (a.payload.meta?.pagination) s.total = a.payload.meta.pagination.total; });
    b.addCase(fetchAudits.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchAudit.fulfilled, (s, a) => { s.selectedAudit = a.payload.data; });
    b.addCase(fetchNextAuditNumber.fulfilled, (s, a) => { s.nextAuditNumber = a.payload.data?.nextAuditNumber || 'AUD-000001'; });
    b.addCase(createAudit.fulfilled, (s, a) => { s.audits.unshift(a.payload.data); s.total += 1; });
    b.addCase(deleteAudit.fulfilled, (s, a) => { s.audits = s.audits.filter((x) => x.id !== a.payload); s.total -= 1; });
  },
});
export const { clearSelected, clearError } = slice.actions; export default slice.reducer;
