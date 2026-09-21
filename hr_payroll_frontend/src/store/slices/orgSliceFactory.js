import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Creates a standard CRUD slice for organization entities.
 * @param {string} name - Slice name (e.g., 'departments')
 * @param {object} api - API service with list, getById, create, update, delete methods
 */
export const createOrgSlice = (name, api) => {
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, async (params, { rejectWithValue }) => {
    try {
      const res = await api.list(params);
      return { data: res.data?.data || [], pagination: res.data?.meta?.pagination || {} };
    } catch (e) { return rejectWithValue(e.response?.data?.message || `Failed to load ${name}`); }
  });

  const fetchOne = createAsyncThunk(`${name}/fetchOne`, async (id, { rejectWithValue }) => {
    try { const res = await api.getById(id); return res.data?.data || null; }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to load'); }
  });

  const create = createAsyncThunk(`${name}/create`, async (data, { rejectWithValue }) => {
    try { const res = await api.create(data); return res.data?.data || null; }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to create'); }
  });

  const update = createAsyncThunk(`${name}/update`, async ({ id, data }, { rejectWithValue }) => {
    try { const res = await api.update(id, data); return res.data?.data || null; }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update'); }
  });

  const remove = createAsyncThunk(`${name}/delete`, async (id, { rejectWithValue }) => {
    try { await api.delete(id); return id; }
    catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to delete'); }
  });

  const slice = createSlice({
    name,
    initialState: { list: [], pagination: null, selected: null, loading: false, saving: false, error: null },
    reducers: {
      clearSelected: (s) => { s.selected = null; },
      clearError: (s) => { s.error = null; },
    },
    extraReducers: (b) => {
      b.addCase(fetchAll.pending, (s) => { s.loading = true; s.error = null; });
      b.addCase(fetchAll.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; });
      b.addCase(fetchAll.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
      b.addCase(fetchOne.fulfilled, (s, a) => { s.selected = a.payload; });
      b.addCase(create.pending, (s) => { s.saving = true; });
      b.addCase(create.fulfilled, (s) => { s.saving = false; });
      b.addCase(create.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
      b.addCase(update.pending, (s) => { s.saving = true; });
      b.addCase(update.fulfilled, (s, a) => { s.saving = false; s.selected = a.payload; const i = s.list.findIndex(x => x.id === a.payload.id); if (i !== -1) s.list[i] = a.payload; });
      b.addCase(update.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
      b.addCase(remove.pending, (s) => { s.saving = true; });
      b.addCase(remove.fulfilled, (s, a) => { s.saving = false; s.list = s.list.filter(x => x.id !== a.payload); });
      b.addCase(remove.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
    },
  });

  return { slice, fetchAll, fetchOne, create, update, remove };
};
