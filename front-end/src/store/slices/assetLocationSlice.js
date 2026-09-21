import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; import api from '../../services/assetLocationApi';
export const fetchLocations = createAsyncThunk('locations/fetchAll', async (p, { rejectWithValue }) => { try { return await api.getAll(p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const fetchActiveLocations = createAsyncThunk('locations/fetchActive', async (_, { rejectWithValue }) => { try { return await api.getActive(); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createLocation = createAsyncThunk('locations/create', async (d, { rejectWithValue }) => { try { return await api.create(d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateLocation = createAsyncThunk('locations/update', async ({ id, data }, { rejectWithValue }) => { try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const toggleLocationStatus = createAsyncThunk('locations/toggleStatus', async (id, { rejectWithValue }) => { try { return await api.toggleStatus(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteLocation = createAsyncThunk('locations/delete', async (id, { rejectWithValue }) => { try { await api.del(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
const slice = createSlice({
  name: 'locations', initialState: { locations: [], activeLocations: [], loading: false, error: null, total: 0 },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchLocations.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchLocations.fulfilled, (s, a) => { s.loading = false; s.locations = a.payload.data || []; if (a.payload.meta?.pagination) s.total = a.payload.meta.pagination.total; });
    b.addCase(fetchLocations.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchActiveLocations.fulfilled, (s, a) => { s.activeLocations = a.payload.data || []; });
    b.addCase(createLocation.fulfilled, (s, a) => { s.locations.unshift(a.payload.data); s.total += 1; });
    b.addCase(updateLocation.fulfilled, (s, a) => { const i = s.locations.findIndex((x) => x.id === a.payload.data.id); if (i !== -1) s.locations[i] = a.payload.data; });
    b.addCase(toggleLocationStatus.fulfilled, (s, a) => { const i = s.locations.findIndex((x) => x.id === a.payload.data.id); if (i !== -1) s.locations[i] = a.payload.data; });
    b.addCase(deleteLocation.fulfilled, (s, a) => { s.locations = s.locations.filter((x) => x.id !== a.payload); s.total -= 1; });
  },
});
export const { clearError } = slice.actions; export default slice.reducer;
