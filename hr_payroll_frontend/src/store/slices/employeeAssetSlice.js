import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/employeeAssetApi';

export const fetchAssets = createAsyncThunk('employeeAssets/fetchAll', async (params, { rejectWithValue }) => {
  try { return await api.list(params); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchAsset = createAsyncThunk('employeeAssets/fetchOne', async (id, { rejectWithValue }) => {
  try { return await api.getById(id); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchAssetsByEmployee = createAsyncThunk('employeeAssets/fetchByEmployee', async (employeeId, { rejectWithValue }) => {
  try { return await api.getByEmployee(employeeId); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const createAsset = createAsyncThunk('employeeAssets/create', async (data, { rejectWithValue }) => {
  try { return await api.create(data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const updateAsset = createAsyncThunk('employeeAssets/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await api.update(id, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const deleteAsset = createAsyncThunk('employeeAssets/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(id); return id; } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const slice = createSlice({
  name: 'employeeAssets',
  initialState: { list: [], pagination: null, selected: null, loading: false, saving: false, error: null },
  reducers: {
    clearSelectedAsset: (state) => { state.selected = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAssets.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAssets.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data?.data || a.payload.data || []; s.pagination = a.payload.data?.meta?.pagination || a.payload.meta?.pagination || null; })
      .addCase(fetchAssets.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // Fetch one
      .addCase(fetchAsset.pending, (s) => { s.loading = true; })
      .addCase(fetchAsset.fulfilled, (s, a) => { s.loading = false; s.selected = a.payload.data?.data || a.payload.data; })
      .addCase(fetchAsset.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // Fetch by employee
      .addCase(fetchAssetsByEmployee.pending, (s) => { s.loading = true; })
      .addCase(fetchAssetsByEmployee.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data?.data || a.payload.data || []; })
      .addCase(fetchAssetsByEmployee.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // Create
      .addCase(createAsset.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(createAsset.fulfilled, (s) => { s.saving = false; })
      .addCase(createAsset.rejected, (s, a) => { s.saving = false; s.error = a.payload; })
      // Update
      .addCase(updateAsset.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(updateAsset.fulfilled, (s) => { s.saving = false; })
      .addCase(updateAsset.rejected, (s, a) => { s.saving = false; s.error = a.payload; })
      // Delete
      .addCase(deleteAsset.pending, (s) => { s.saving = true; })
      .addCase(deleteAsset.fulfilled, (s, a) => { s.saving = false; s.list = s.list.filter((item) => item.id !== a.payload); })
      .addCase(deleteAsset.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export const { clearSelectedAsset, clearError } = slice.actions;
export default slice.reducer;
