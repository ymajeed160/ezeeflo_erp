import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; import api from '../../services/assetInsuranceApi';
export const fetchInsurances = createAsyncThunk('insurances/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchInsurance = createAsyncThunk('insurances/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextInsuranceNumber = createAsyncThunk('insurances/fetchNextNumber', async (_, { rejectWithValue }) => { try { return await api.getNextNumber(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createInsurance = createAsyncThunk('insurances/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateInsurance = createAsyncThunk('insurances/update', async ({ id, data }, { rejectWithValue }) => { try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteInsurance = createAsyncThunk('insurances/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
const slice = createSlice({
  name: 'insurances', initialState: { insurances: [], selectedInsurance: null, nextInsuranceNumber: '', loading: false, error: null, total: 0 },
  reducers: { clearSelected: (s) => { s.selectedInsurance = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchInsurances.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchInsurances.fulfilled, (s, a) => { s.loading = false; s.insurances = a.payload.data || []; if (a.payload.meta?.pagination) s.total = a.payload.meta.pagination.total; });
    b.addCase(fetchInsurances.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchInsurance.fulfilled, (s, a) => { s.selectedInsurance = a.payload.data; });
    b.addCase(fetchNextInsuranceNumber.fulfilled, (s, a) => { s.nextInsuranceNumber = a.payload.data?.nextInsuranceNumber || 'INS-000001'; });
    b.addCase(createInsurance.fulfilled, (s, a) => { s.insurances.unshift(a.payload.data); s.total += 1; });
    b.addCase(updateInsurance.fulfilled, (s, a) => { const i = s.insurances.findIndex((x) => x.id === a.payload.data.id); if (i !== -1) s.insurances[i] = a.payload.data; });
    b.addCase(deleteInsurance.fulfilled, (s, a) => { s.insurances = s.insurances.filter((x) => x.id !== a.payload); s.total -= 1; });
  },
});
export const { clearSelected, clearError } = slice.actions; export default slice.reducer;
