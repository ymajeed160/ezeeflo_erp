import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import hrApi from '../../services/hrApi';

export const fetchUsers = createAsyncThunk('users/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await hrApi.get('/users', { params }); return { data: res.data?.data || [], pagination: res.data?.pagination || {} }; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try { const res = await hrApi.post('/users', data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const updateUser = createAsyncThunk('users/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await hrApi.put(`/users/${id}`, data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try { await hrApi.delete(`/users/${id}`); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const lockUser = createAsyncThunk('users/lock', async (id, { rejectWithValue }) => {
  try { const res = await hrApi.post(`/users/${id}/lock`); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const unlockUser = createAsyncThunk('users/unlock', async (id, { rejectWithValue }) => {
  try { const res = await hrApi.post(`/users/${id}/unlock`); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const resetUserPassword = createAsyncThunk('users/resetPassword', async ({ id, password }, { rejectWithValue }) => {
  try { const res = await hrApi.post(`/users/${id}/reset-password`, { password }); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const userSlice = createSlice({
  name: 'users',
  initialState: { list: [], pagination: { total: 0 }, loading: false, saving: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchUsers.pending, s => { s.loading = true; });
    b.addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; });
    b.addCase(fetchUsers.rejected, s => { s.loading = false; });
    b.addCase(createUser.pending, s => { s.saving = true; });
    b.addCase(createUser.fulfilled, s => { s.saving = false; });
    b.addCase(createUser.rejected, s => { s.saving = false; });
    b.addCase(updateUser.pending, s => { s.saving = true; });
    b.addCase(updateUser.fulfilled, s => { s.saving = false; });
    b.addCase(updateUser.rejected, s => { s.saving = false; });
  },
});

export default userSlice.reducer;
