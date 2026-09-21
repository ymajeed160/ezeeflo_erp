import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/assetRevaluationApi';

export const fetchRevaluations = createAsyncThunk('revaluations/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchRevaluation = createAsyncThunk('revaluations/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextRevaluationNumber = createAsyncThunk('revaluations/fetchNextNumber', async (_, { rejectWithValue }) => { try { return await api.getNextNumber(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createRevaluation = createAsyncThunk('revaluations/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const postRevaluation = createAsyncThunk('revaluations/post', async (id, { rejectWithValue }) => { try { return await api.post(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteRevaluation = createAsyncThunk('revaluations/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'revaluations',
  initialState: { revaluations: [], selectedRevaluation: null, nextRevaluationNumber: '', loading: false, error: null, total: 0 },
  reducers: { clearSelected: (s) => { s.selectedRevaluation = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchRevaluations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchRevaluations.fulfilled, (s, a) => { s.loading = false; s.revaluations = a.payload.data || []; if (a.payload.meta?.pagination) { s.total = a.payload.meta.pagination.total; } });
    b.addCase(fetchRevaluations.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchRevaluation.fulfilled, (s, a) => { s.selectedRevaluation = a.payload.data; });
    b.addCase(fetchNextRevaluationNumber.fulfilled, (s, a) => { s.nextRevaluationNumber = a.payload.data?.nextRevaluationNumber || 'REV-000001'; });
    b.addCase(createRevaluation.fulfilled, (s, a) => { s.revaluations.unshift(a.payload.data); s.total += 1; });
    b.addCase(postRevaluation.fulfilled, (s, a) => { const i = s.revaluations.findIndex((d) => d.id === a.payload.data.id); if (i !== -1) s.revaluations[i] = a.payload.data; });
    b.addCase(deleteRevaluation.fulfilled, (s, a) => { s.revaluations = s.revaluations.filter((d) => d.id !== a.payload); s.total -= 1; });
  },
});

export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
