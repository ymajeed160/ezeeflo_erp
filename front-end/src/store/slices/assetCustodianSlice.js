import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; import api from '../../services/assetCustodianApi';
export const fetchCustodians = createAsyncThunk('custodians/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchActiveCustodians = createAsyncThunk('custodians/fetchActive', async (_, { rejectWithValue }) => { try { return await api.getActive(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createCustodian = createAsyncThunk('custodians/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateCustodian = createAsyncThunk('custodians/update', async ({ id, data }, { rejectWithValue }) => { try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const toggleCustodianStatus = createAsyncThunk('custodians/toggleStatus', async (id, { rejectWithValue }) => { try { return await api.toggleStatus(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteCustodian = createAsyncThunk('custodians/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
const slice = createSlice({
  name: 'custodians', initialState: { custodians: [], activeCustodians: [], loading: false, error: null, total: 0 },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchCustodians.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchCustodians.fulfilled, (s, a) => { s.loading = false; s.custodians = a.payload.data || []; if (a.payload.meta?.pagination) s.total = a.payload.meta.pagination.total; });
    b.addCase(fetchCustodians.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchActiveCustodians.fulfilled, (s, a) => { s.activeCustodians = a.payload.data || []; });
    b.addCase(createCustodian.fulfilled, (s, a) => { s.custodians.unshift(a.payload.data); s.total += 1; });
    b.addCase(updateCustodian.fulfilled, (s, a) => { const i = s.custodians.findIndex((x) => x.id === a.payload.data.id); if (i !== -1) s.custodians[i] = a.payload.data; });
    b.addCase(toggleCustodianStatus.fulfilled, (s, a) => { const i = s.custodians.findIndex((x) => x.id === a.payload.data.id); if (i !== -1) s.custodians[i] = a.payload.data; });
    b.addCase(deleteCustodian.fulfilled, (s, a) => { s.custodians = s.custodians.filter((x) => x.id !== a.payload); s.total -= 1; });
  },
});
export const { clearError } = slice.actions; export default slice.reducer;
