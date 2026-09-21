import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/assetDepreciationApi';

export const fetchDepreciations = createAsyncThunk('depreciations/fetchAll', async (p, { rejectWithValue }) => { try { const r = await api.getAll(p); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchDepreciation = createAsyncThunk('depreciations/fetchById', async (id, { rejectWithValue }) => { try { const r = await api.getById(id); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextDepreciationNumber = createAsyncThunk('depreciations/fetchNextNumber', async (_, { rejectWithValue }) => { try { const r = await api.getNextNumber(); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const previewDepreciation = createAsyncThunk('depreciations/preview', async (data, { rejectWithValue }) => { try { const r = await api.preview(data); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const postDepreciation = createAsyncThunk('depreciations/post', async (data, { rejectWithValue }) => { try { const r = await api.post(data); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const reverseDepreciation = createAsyncThunk('depreciations/reverse', async (id, { rejectWithValue }) => { try { const r = await api.reverse(id); return r; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteDepreciation = createAsyncThunk('depreciations/delete', async (id, { rejectWithValue }) => { try { await api.delete(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'depreciations',
  initialState: { depreciations: [], selectedDepreciation: null, nextDepreciationNumber: '', previewResult: null, loading: false, error: null, total: 0, page: 1, pageSize: 10 },
  reducers: { clearSelected: (s) => { s.selectedDepreciation = null; s.previewResult = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchDepreciations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchDepreciations.fulfilled, (s, a) => { s.loading = false; s.depreciations = a.payload.data || []; if (a.payload.meta?.pagination) { s.total = a.payload.meta.pagination.total; s.page = a.payload.meta.pagination.page; s.pageSize = a.payload.meta.pagination.limit; } });
    b.addCase(fetchDepreciations.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchDepreciation.fulfilled, (s, a) => { s.selectedDepreciation = a.payload.data; });
    b.addCase(fetchNextDepreciationNumber.fulfilled, (s, a) => { s.nextDepreciationNumber = a.payload.data?.nextDepreciationNumber || 'DEP-000001'; });
    b.addCase(previewDepreciation.pending, (s) => { s.loading = true; });
    b.addCase(previewDepreciation.fulfilled, (s, a) => { s.loading = false; s.previewResult = a.payload.data; });
    b.addCase(previewDepreciation.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(postDepreciation.fulfilled, (s, a) => { s.depreciations.unshift(a.payload.data); s.total += 1; });
    b.addCase(reverseDepreciation.fulfilled, (s, a) => { const idx = s.depreciations.findIndex((d) => d.id === a.payload.data.id); if (idx !== -1) s.depreciations[idx] = a.payload.data; });
    b.addCase(deleteDepreciation.fulfilled, (s, a) => { s.depreciations = s.depreciations.filter((d) => d.id !== a.payload); s.total -= 1; });
  },
});

export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
