import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/assetMaintenanceApi';

export const fetchMaintenances = createAsyncThunk('maintenances/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchMaintenance = createAsyncThunk('maintenances/fetchById', async (id, { rejectWithValue }) => { try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchNextMaintenanceNumber = createAsyncThunk('maintenances/fetchNextNumber', async (_, { rejectWithValue }) => { try { return await api.getNextNumber(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createMaintenance = createAsyncThunk('maintenances/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateMaintenance = createAsyncThunk('maintenances/update', async ({ id, data }, { rejectWithValue }) => { try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteMaintenance = createAsyncThunk('maintenances/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const slice = createSlice({
  name: 'maintenances',
  initialState: { maintenances: [], selectedMaintenance: null, nextMaintenanceNumber: '', loading: false, error: null, total: 0 },
  reducers: { clearSelected: (s) => { s.selectedMaintenance = null; }, clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchMaintenances.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchMaintenances.fulfilled, (s, a) => { s.loading = false; s.maintenances = a.payload.data || []; if (a.payload.meta?.pagination) s.total = a.payload.meta.pagination.total; });
    b.addCase(fetchMaintenances.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchMaintenance.fulfilled, (s, a) => { s.selectedMaintenance = a.payload.data; });
    b.addCase(fetchNextMaintenanceNumber.fulfilled, (s, a) => { s.nextMaintenanceNumber = a.payload.data?.nextMaintenanceNumber || 'AMN-000001'; });
    b.addCase(createMaintenance.fulfilled, (s, a) => { s.maintenances.unshift(a.payload.data); s.total += 1; });
    b.addCase(updateMaintenance.fulfilled, (s, a) => { const i = s.maintenances.findIndex((m) => m.id === a.payload.data.id); if (i !== -1) s.maintenances[i] = a.payload.data; });
    b.addCase(deleteMaintenance.fulfilled, (s, a) => { s.maintenances = s.maintenances.filter((m) => m.id !== a.payload); s.total -= 1; });
  },
});

export const { clearSelected, clearError } = slice.actions;
export default slice.reducer;
