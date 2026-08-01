import ShiftApi from '../../services/shiftApi';
import AttendanceApi from '../../services/attendanceApi';
import ShiftAssignmentApi from '../../services/shiftAssignmentApi';
import RosterApi from '../../services/rosterApi';
import OvertimeApi from '../../services/overtimeApi';
import { createOrgSlice } from './orgSliceFactory';

export const {
  slice: shiftSlice, fetchAll: fetchShifts, fetchOne: fetchShift,
  create: createShift, update: updateShift, remove: deleteShift,
} = createOrgSlice('shifts', ShiftApi);

export const {
  slice: saSlice, fetchAll: fetchShiftAssignments, fetchOne: fetchShiftAssignment,
  create: createShiftAssignment, update: updateShiftAssignment, remove: deleteShiftAssignment,
} = createOrgSlice('shiftAssignments', ShiftAssignmentApi);

export const {
  slice: rosterSlice, fetchAll: fetchRosters, fetchOne: fetchRoster,
  create: createRoster, update: updateRoster, remove: deleteRoster,
} = createOrgSlice('rosters', RosterApi);

export const {
  slice: overtimeSlice, fetchAll: fetchOvertimes, fetchOne: fetchOvertime,
  create: createOvertime, update: updateOvertime, remove: deleteOvertime,
} = createOrgSlice('overtimes', OvertimeApi);

// Attendance slice with extra reducer for today summary
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAttendances = createAsyncThunk('attendance/fetchAll', async (params, { rejectWithValue }) => {
  try { const res = await AttendanceApi.list(params); return { data: res.data?.data || [], pagination: res.data?.meta?.pagination || {} }; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const markAttendance = createAsyncThunk('attendance/mark', async (data, { rejectWithValue }) => {
  try { const res = await AttendanceApi.mark(data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchTodaySummary = createAsyncThunk('attendance/todaySummary', async (_, { rejectWithValue }) => {
  try { const res = await AttendanceApi.todaySummary(); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const updateAttendance = createAsyncThunk('attendance/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await AttendanceApi.update(id, data); return res.data?.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const deleteAttendance = createAsyncThunk('attendance/delete', async (id, { rejectWithValue }) => {
  try { await AttendanceApi.delete(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: { list: [], pagination: null, todaySummary: null, loading: false, saving: false, error: null },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchAttendances.pending, (s) => { s.loading = true; });
    b.addCase(fetchAttendances.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.pagination = a.payload.pagination; });
    b.addCase(fetchAttendances.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(markAttendance.pending, (s) => { s.saving = true; });
    b.addCase(markAttendance.fulfilled, (s) => { s.saving = false; });
    b.addCase(markAttendance.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
    b.addCase(fetchTodaySummary.fulfilled, (s, a) => { s.todaySummary = a.payload; });
  },
});

export const attendanceReducers = {
  shifts: shiftSlice.reducer,
  shiftAssignments: saSlice.reducer,
  rosters: rosterSlice.reducer,
  overtimes: overtimeSlice.reducer,
  attendance: attendanceSlice.reducer,
};
