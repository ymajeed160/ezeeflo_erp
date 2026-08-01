import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, CircularProgress, InputAdornment, MenuItem, Select,
  FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  AccessTime, EventRepeat, CalendarMonth, Schedule, Timer,
  CheckCircle as ApproveIcon, Login as CheckInIcon, Logout as CheckOutIcon,
} from '@mui/icons-material';
import OvertimeApi from '../../services/overtimeApi';
import {
  fetchShifts, createShift, updateShift, deleteShift,
  fetchShiftAssignments, createShiftAssignment, updateShiftAssignment, deleteShiftAssignment,
  fetchRosters, createRoster,
  fetchOvertimes, createOvertime, updateOvertime, deleteOvertime,
  fetchAttendances, markAttendance, fetchTodaySummary, updateAttendance, deleteAttendance,
} from '../../store/slices/attendanceSlices';
import { showSuccess, showError } from '../../utils/toast';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import ShiftSelect from '../../components/Shared/ShiftSelect';

// ── Tab Config ──
const TABS = [
  { key: 'attendance', label: 'Attendance', icon: <AccessTime /> },
  { key: 'shifts', label: 'Shifts', icon: <Schedule /> },
  { key: 'assignments', label: 'Shift Assignments', icon: <EventRepeat /> },
  { key: 'rosters', label: 'Rosters', icon: <CalendarMonth /> },
  { key: 'overtime', label: 'Overtime', icon: <Timer /> },
];

const STATUS_COLORS = { Present: 'success', Absent: 'error', Late: 'warning', 'Half Day': 'info', 'Weekly Off': 'default', Holiday: 'info', 'On Leave': 'secondary' };
const SHIFT_TYPES = ['Morning', 'Evening', 'Night', 'Rotational', 'Flexible'];
const OT_TYPES = ['Regular', 'Weekend', 'Holiday'];

const AttendancePage = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('attendance');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickData, setQuickData] = useState({});

  // Get state for current tab
  const sliceMap = {
    attendance: (s) => s.attendance,
    shifts: (s) => s.shifts,
    assignments: (s) => s.shiftAssignments,
    rosters: (s) => s.rosters,
    overtime: (s) => s.overtimes,
  };
  const sliceState = useSelector(sliceMap[tabKey]) || { list: [], loading: false, saving: false };
  const todaySummary = useSelector((s) => s.attendance?.todaySummary);

  // Thunk maps
  const thunkMap = {
    shifts: { fetch: fetchShifts, create: createShift, update: updateShift, remove: deleteShift },
    assignments: { fetch: fetchShiftAssignments, create: createShiftAssignment, update: updateShiftAssignment, remove: deleteShiftAssignment },
    rosters: { fetch: fetchRosters, create: createRoster, update: createRoster, remove: createRoster },
    overtime: { fetch: fetchOvertimes, create: createOvertime, update: updateOvertime, remove: deleteOvertime },
    attendance: { fetch: fetchAttendances, update: updateAttendance, remove: deleteAttendance },
  };

  const loadData = useCallback(() => {
    if (tabKey === 'attendance') {
      dispatch(fetchAttendances({ page: page + 1, limit: rowsPerPage, search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }));
      dispatch(fetchTodaySummary());
    } else {
      const thunks = thunkMap[tabKey];
      if (thunks?.fetch) dispatch(thunks.fetch({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
    }
  }, [dispatch, tabKey, page, rowsPerPage, search, dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = () => { setFormData({ isActive: true }); setEditMode(false); setDialogOpen(true); };
  const handleEdit = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteOpen(true); };

  const handleDelete = async () => {
    const thunks = thunkMap[tabKey];
    if (!thunks?.remove) return;
    const r = await dispatch(thunks.remove(selectedId));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Deleted'); setDeleteOpen(false); loadData(); }
    else showError(r.payload || 'Failed');
  };

  const handleSubmit = async () => {
    const thunks = thunkMap[tabKey];
    if (!thunks) return;
    if (editMode) {
      const r = await dispatch(thunks.update({ id: selectedId, data: formData }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    } else {
      const r = await dispatch(thunks.create(formData));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    }
  };

  const handleQuickCheckIn = () => { setQuickData({}); setQuickOpen(true); };

  const handleQuickCheckInSubmit = async () => {
    if (!quickData.employeeId) return showError('Please select an employee');
    const now = new Date();
    const r = await dispatch(markAttendance({
      employeeId: quickData.employeeId, attendanceDate: now.toISOString().split('T')[0],
      checkInTime: now.toISOString(), method: 'Manual',
    }));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Check-in recorded'); setQuickOpen(false); loadData(); }
    else showError(r.payload || 'Failed');
  };

  const handleApproveOvertime = async (id) => {
    try { await OvertimeApi.approve(id); showSuccess('Overtime approved'); loadData(); }
    catch (e) { showError('Approval failed'); }
  };

  const handleCheckOut = async (record) => {
    const r = await dispatch(markAttendance({
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      checkOutTime: new Date().toISOString(),
      method: 'Manual',
    }));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Check-out recorded'); loadData(); }
    else showError(r.payload || 'Check-out failed');
  };

  const { list = [], loading, saving } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  // ── Render helpers ──

  const renderAttendanceTable = () => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Employee</TableCell><TableCell>Date</TableCell><TableCell>Check In</TableCell>
          <TableCell>Check Out</TableCell><TableCell>Status</TableCell><TableCell>Late (min)</TableCell>
          <TableCell>Worked (min)</TableCell><TableCell>OT (min)</TableCell><TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {list.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No records found</Typography></TableCell></TableRow> :
          list.map(r => (
            <TableRow key={r.id} hover>
              <TableCell><Typography variant="body2" fontWeight={600}>{r.employee?.name || '—'}</Typography><Typography variant="caption">{r.employee?.employeeCode}</Typography></TableCell>
              <TableCell>{r.attendanceDate}</TableCell>
              <TableCell>{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}</TableCell>
              <TableCell>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '—'}</TableCell>
              <TableCell><Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || 'default'} /></TableCell>
              <TableCell>{r.lateMinutes || 0}</TableCell>
              <TableCell>{r.totalWorkedMinutes || 0}</TableCell>
              <TableCell>{r.overtimeMinutes || 0}</TableCell>
              <TableCell align="right">
                {!r.checkOutTime && (
                  <Tooltip title="Check Out"><IconButton size="small" color="success" onClick={() => handleCheckOut(r)}><CheckOutIcon fontSize="small" /></IconButton></Tooltip>
                )}
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  const renderShiftTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Time</TableCell><TableCell>Grace/Late (min)</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>
        {list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No shifts found</Typography></TableCell></TableRow> :
          list.map(s => (
            <TableRow key={s.id} hover>
              <TableCell><Chip label={s.code} size="small" variant="outlined" /></TableCell>
              <TableCell><Typography fontWeight={600}>{s.name}</Typography></TableCell>
              <TableCell><Chip label={s.shiftType} size="small" color="primary" variant="outlined" /></TableCell>
              <TableCell>{s.startTime} — {s.endTime}</TableCell>
              <TableCell>{s.gracePeriodMinutes} / {s.lateThresholdMinutes}</TableCell>
              <TableCell><Chip label={s.isActive ? 'Active' : 'Inactive'} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
              <TableCell align="right">
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(s.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  const renderAssignmentTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Shift</TableCell><TableCell>Effective From</TableCell><TableCell>Effective To</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>
        {list.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No assignments</Typography></TableCell></TableRow> :
          list.map(a => (
            <TableRow key={a.id} hover>
              <TableCell><Typography fontWeight={600}>{a.employee?.name || '—'}</Typography></TableCell>
              <TableCell>{a.shift?.name || '—'} <Chip label={a.shift?.shiftType} size="small" variant="outlined" /></TableCell>
              <TableCell>{a.effectiveFrom}</TableCell>
              <TableCell>{a.effectiveTo || 'Ongoing'}</TableCell>
              <TableCell><Chip label={a.isActive ? 'Active' : 'Inactive'} size="small" color={a.isActive ? 'success' : 'default'} /></TableCell>
              <TableCell align="right">
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(a.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  const renderRosterTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Date</TableCell><TableCell>Shift</TableCell><TableCell>Weekly Off</TableCell><TableCell>Holiday</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>
        {list.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No rosters</Typography></TableCell></TableRow> :
          list.map(r => (
            <TableRow key={r.id} hover>
              <TableCell><Typography fontWeight={600}>{r.employee?.name || '—'}</Typography></TableCell>
              <TableCell>{r.rosterDate}</TableCell>
              <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{r.shift?.color && <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: r.shift.color }} />}{r.shift?.name || '—'}</Box></TableCell>
              <TableCell>{r.isWeeklyOff ? <Chip label="Yes" size="small" color="warning" /> : 'No'}</TableCell>
              <TableCell>{r.isHoliday ? <Chip label="Yes" size="small" color="info" /> : 'No'}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  const renderOvertimeTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Minutes</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>
        {list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No overtime records</Typography></TableCell></TableRow> :
          list.map(o => (
            <TableRow key={o.id} hover>
              <TableCell><Typography fontWeight={600}>{o.employee?.name || '—'}</Typography></TableCell>
              <TableCell>{o.overtimeDate}</TableCell>
              <TableCell>{o.startTime} — {o.endTime}</TableCell>
              <TableCell>{o.totalMinutes}</TableCell>
              <TableCell><Chip label={o.overtimeType} size="small" variant="outlined" /></TableCell>
              <TableCell><Chip label={o.status} size="small" color={o.status === 'Approved' ? 'success' : o.status === 'Pending' ? 'warning' : 'error'} /></TableCell>
              <TableCell align="right">
                {o.status === 'Pending' && (
                  <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApproveOvertime(o.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                )}
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(o)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(o.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );

  const renderTable = () => {
    switch (tabKey) {
      case 'attendance': return renderAttendanceTable();
      case 'shifts': return renderShiftTable();
      case 'assignments': return renderAssignmentTable();
      case 'rosters': return renderRosterTable();
      case 'overtime': return renderOvertimeTable();
      default: return null;
    }
  };

  // ── Form fields by tab ──
  const renderFormFields = () => {
    switch (tabKey) {
      case 'attendance':
        return (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Date *" type="date" value={formData.attendanceDate || ''} onChange={e => setFormData({ ...formData, attendanceDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Status" value={formData.status || 'Present'} onChange={e => setFormData({ ...formData, status: e.target.value })}>{Object.keys(STATUS_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Check In" type="datetime-local" value={formData.checkInTime || ''} onChange={e => setFormData({ ...formData, checkInTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Check Out" type="datetime-local" value={formData.checkOutTime || ''} onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Late (min)" type="number" value={formData.lateMinutes || ''} onChange={e => setFormData({ ...formData, lateMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Early Leaving (min)" type="number" value={formData.earlyLeavingMinutes || ''} onChange={e => setFormData({ ...formData, earlyLeavingMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Overtime (min)" type="number" value={formData.overtimeMinutes || ''} onChange={e => setFormData({ ...formData, overtimeMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Remarks" multiline rows={2} value={formData.remarks || ''} onChange={e => setFormData({ ...formData, remarks: e.target.value })} /></Grid>
          </Grid>
        );
      case 'shifts':
        return (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Shift Type *" value={formData.shiftType || ''} onChange={e => setFormData({ ...formData, shiftType: e.target.value })}>{SHIFT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Start Time *" type="time" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="End Time *" type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Grace Period (min)" type="number" value={formData.gracePeriodMinutes || 15} onChange={e => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Late Threshold (min)" type="number" value={formData.lateThresholdMinutes || 30} onChange={e => setFormData({ ...formData, lateThresholdMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Half Day (min)" type="number" value={formData.halfDayThresholdMinutes || 240} onChange={e => setFormData({ ...formData, halfDayThresholdMinutes: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={3}><TextField fullWidth size="small" label="Weekly Off Days" placeholder="0,6" value={formData.weeklyOffDays || ''} onChange={e => setFormData({ ...formData, weeklyOffDays: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
          </Grid>
        );
      case 'assignments':
        return (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
            <Grid item xs={6}><ShiftSelect value={formData.shiftId} onChange={v => setFormData({ ...formData, shiftId: v })} label="Shift" required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Effective From *" type="date" value={formData.effectiveFrom || ''} onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Effective To" type="date" value={formData.effectiveTo || ''} onChange={e => setFormData({ ...formData, effectiveTo: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></Grid>
          </Grid>
        );
      case 'rosters':
        return (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
            <Grid item xs={6}><ShiftSelect value={formData.shiftId} onChange={v => setFormData({ ...formData, shiftId: v })} label="Shift" required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Date *" type="date" value={formData.rosterDate || ''} onChange={e => setFormData({ ...formData, rosterDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></Grid>
          </Grid>
        );
      case 'overtime':
        return (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Date *" type="date" value={formData.overtimeDate || ''} onChange={e => setFormData({ ...formData, overtimeDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Start Time *" type="time" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="End Time *" type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={4}><TextField select fullWidth size="small" label="Type" value={formData.overtimeType || 'Regular'} onChange={e => setFormData({ ...formData, overtimeType: e.target.value })}>{OT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Rate Multiplier" type="number" value={formData.rateMultiplier || 1.25} onChange={e => setFormData({ ...formData, rateMultiplier: parseFloat(e.target.value) })} inputProps={{ min: 1, max: 3, step: 0.25 }} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={2} value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} /></Grid>
          </Grid>
        );
      default: return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Attendance & Shift Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage attendance, shifts, rosters, and overtime
      </Typography>

      {/* Today Summary (Attendance tab) */}
      {tabKey === 'attendance' && todaySummary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={2}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="success.main">{todaySummary.present || 0}</Typography><Typography variant="caption">Present</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={2}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="error.main">{todaySummary.absent || 0}</Typography><Typography variant="caption">Absent</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={2}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="warning.main">{todaySummary.late || 0}</Typography><Typography variant="caption">Late</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={2}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="info.main">{todaySummary.halfDay || 0}</Typography><Typography variant="caption">Half Day</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={2}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5">{todaySummary.total || 0}</Typography><Typography variant="caption">Total</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Tabs value={tabKey} onChange={(e, v) => { setTabKey(v); setPage(0); setSearch(''); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(t => <Tab key={t.key} value={t.key} icon={t.icon} label={t.label} iconPosition="start" />)}
      </Tabs>

      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={tabKey === 'attendance' ? 4 : 6}>
              <TextField fullWidth size="small" placeholder="Search..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} />
            </Grid>
            {tabKey === 'attendance' && (
              <>
                <Grid item xs={6} md={3}>
                  <TextField fullWidth size="small" label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField fullWidth size="small" label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
              </>
            )}
            <Grid item xs={tabKey === 'attendance' ? 12 : 3} md={2} sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
              {tabKey !== 'attendance' && <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button>}
              {tabKey === 'attendance' && <Button variant="contained" startIcon={<CheckInIcon />} onClick={handleQuickCheckIn}>Quick Check-In</Button>}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <>
            <TableContainer>{renderTable()}</TableContainer>
            <TablePagination component="div" count={pagination.total || 0} page={page}
              onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} />
          </>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit' : 'Add'} {TABS.find(t => t.key === tabKey)?.label?.replace(/s$/, '')}</DialogTitle>
        <DialogContent dividers>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Quick Check-In Dialog */}
      <Dialog open={quickOpen} onClose={() => setQuickOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Check-In</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><EmployeeSelect value={quickData.employeeId} onChange={v => setQuickData({ ...quickData, employeeId: v })} label="Employee" required /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickCheckInSubmit}>Check In</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendancePage;
