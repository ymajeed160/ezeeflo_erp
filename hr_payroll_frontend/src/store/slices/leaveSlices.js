import LeaveTypeApi from '../../services/leaveTypeApi';
import LeaveApplicationApi from '../../services/leaveApplicationApi';
import LeaveBalanceApi from '../../services/leaveBalanceApi';
import HolidayApi from '../../services/holidayApi';
import { createOrgSlice } from './orgSliceFactory';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const { slice: leaveTypeSlice, fetchAll: fetchLeaveTypes, create: createLeaveType, update: updateLeaveType, remove: deleteLeaveType } = createOrgSlice('leaveTypes', LeaveTypeApi);
export const { slice: leaveBalanceSlice, fetchAll: fetchLeaveBalances, create: createLeaveBalance, update: updateLeaveBalance, remove: deleteLeaveBalance } = createOrgSlice('leaveBalances', LeaveBalanceApi);
export const { slice: holidaySlice, fetchAll: fetchHolidays, create: createHoliday, update: updateHoliday, remove: deleteHoliday } = createOrgSlice('holidays', HolidayApi);

// Leave Application — custom slice
export const fetchLeaveApps = createAsyncThunk('leaveApps/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await LeaveApplicationApi.list(params); return { data: res.data?.data || [], pagination: res.data?.meta?.pagination || {} }; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const createLeaveApp = createAsyncThunk('leaveApps/create', async (data, { rejectWithValue }) => {
  try { const res = await LeaveApplicationApi.create(data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const updateLeaveApp = createAsyncThunk('leaveApps/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await LeaveApplicationApi.update(id, data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const deleteLeaveApp = createAsyncThunk('leaveApps/delete', async (id, { rejectWithValue }) => {
  try { await LeaveApplicationApi.delete(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const fetchLeaveSummary = createAsyncThunk('leaveApps/summary', async (_, { rejectWithValue }) => {
  try { const res = await LeaveApplicationApi.summary(); return res.data?.data; }
  catch (e) { return rejectWithValue('Failed'); }
});

const leaveAppSlice = createSlice({
  name: 'leaveApps',
  initialState: { list: [], pagination: null, summary: null, loading: false, saving: false, error: null },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchLeaveApps.pending, (s) => { s.loading = true; });
    b.addCase(fetchLeaveApps.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; });
    b.addCase(fetchLeaveApps.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(createLeaveApp.pending, (s) => { s.saving = true; });
    b.addCase(createLeaveApp.fulfilled, (s) => { s.saving = false; });
    b.addCase(createLeaveApp.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
    b.addCase(deleteLeaveApp.fulfilled, (s, a) => { s.list = s.list.filter(x => x.id !== a.payload); });
    b.addCase(fetchLeaveSummary.fulfilled, (s, a) => { s.summary = a.payload; });
  },
});

export const leaveReducers = {
  leaveTypes: leaveTypeSlice.reducer,
  leaveApps: leaveAppSlice.reducer,
  leaveBalances: leaveBalanceSlice.reducer,
  holidays: holidaySlice.reducer,
};
