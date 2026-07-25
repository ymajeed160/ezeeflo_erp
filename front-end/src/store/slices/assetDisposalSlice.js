import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/assetDisposalApi';

export const fetchDisposals = createAsyncThunk('disposals/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchDisposal = createAsyncThunk('disposals/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextDisposalNumber = createAsyncThunk('disposals/fetchNextNumber', async (_, { rejectWithValue }) => { try { return await api.getNextNumber(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createDisposal = createAsyncThunk('disposals/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const postDisposal = createAsyncThunk('disposals/post', async (id, { rejectWithValue }) => { try { return await api.post(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const reverseDisposal = createAsyncThunk('disposals/reverse', async (id, { rejectWithValue }) => { try { return await api.reverse(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteDisposal = createAsyncThunk('disposals/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'disposals',
  initialState: { disposals: [], selectedDisposal: null, nextDisposalNumber: '', loading: false, error: null, total: 0 },
  reducers: { clearSelected: (s) => { s.selectedDisposal = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchDisposals.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchDisposals.fulfilled, (s, a) => { s.loading = false; s.disposals = a.payload.data || []; if (a.payload.meta?.pagination) { s.total = a.payload.meta.pagination.total; } });
    b.addCase(fetchDisposals.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchDisposal.fulfilled, (s, a) => { s.selectedDisposal = a.payload.data; });
    b.addCase(fetchNextDisposalNumber.fulfilled, (s, a) => { s.nextDisposalNumber = a.payload.data?.nextDisposalNumber || 'DSP-000001'; });
    b.addCase(createDisposal.fulfilled, (s, a) => { s.disposals.unshift(a.payload.data); s.total += 1; });
    b.addCase(postDisposal.fulfilled, (s, a) => { const i = s.disposals.findIndex((d) => d.id === a.payload.data.id); if (i !== -1) s.disposals[i] = a.payload.data; });
    b.addCase(reverseDisposal.fulfilled, (s, a) => { const i = s.disposals.findIndex((d) => d.id === a.payload.data.id); if (i !== -1) s.disposals[i] = a.payload.data; });
    b.addCase(deleteDisposal.fulfilled, (s, a) => { s.disposals = s.disposals.filter((d) => d.id !== a.payload); s.total -= 1; });
  },
});

export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
