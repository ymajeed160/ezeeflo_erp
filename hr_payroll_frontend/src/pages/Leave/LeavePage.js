import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, CircularProgress, InputAdornment, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  EventNote, AccountBalanceWallet, Category, BeachAccess,
  CheckCircle as ApproveIcon, Cancel as RejectIcon,
} from '@mui/icons-material';
import {
  fetchLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
  fetchLeaveApps, createLeaveApp, deleteLeaveApp, fetchLeaveSummary,
  updateLeaveApp,
  fetchLeaveBalances, createLeaveBalance,
  fetchHolidays, createHoliday, updateHoliday, deleteHoliday,
} from '../../store/slices/leaveSlices';
import LeaveApplicationApi from '../../services/leaveApplicationApi';
import { showSuccess, showError } from '../../utils/toast';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import LeaveTypeSelect from '../../components/Shared/LeaveTypeSelect';

const TABS = [
  { key: 'applications', label: 'Leave Applications', icon: <EventNote /> },
  { key: 'balances', label: 'Leave Balances', icon: <AccountBalanceWallet /> },
  { key: 'types', label: 'Leave Types', icon: <Category /> },
  { key: 'holidays', label: 'Holidays', icon: <BeachAccess /> },
];

const STATUS_COLORS = { Draft: 'default', Submitted: 'info', Approved: 'success', Rejected: 'error', Cancelled: 'warning' };
const LEAVE_CATEGORIES = ['Annual', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Unpaid', 'Compensatory', 'Bereavement', 'Study', 'Other'];
const HOLIDAY_TYPES = ['Public', 'Religious', 'National', 'Company'];

const LeavePage = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('applications');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});

  const sliceMap = {
    applications: (s) => s.leaveApps, types: (s) => s.leaveTypes,
    balances: (s) => s.leaveBalances, holidays: (s) => s.holidays,
  };
  const sliceState = useSelector(sliceMap[tabKey]) || { list: [], loading: false, saving: false };
  const appsSummary = useSelector((s) => s.leaveApps?.summary);

  const thunkMap = {
    types: { fetch: fetchLeaveTypes, create: createLeaveType, update: updateLeaveType, remove: deleteLeaveType },
    balances: { fetch: fetchLeaveBalances, create: createLeaveBalance },
    holidays: { fetch: fetchHolidays, create: createHoliday, update: updateHoliday, remove: deleteHoliday },
    applications: { fetch: fetchLeaveApps },
  };

  const loadData = useCallback(() => {
    const t = thunkMap[tabKey];
    if (t?.fetch) dispatch(t.fetch({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
    if (tabKey === 'applications') dispatch(fetchLeaveSummary());
  }, [dispatch, tabKey, page, rowsPerPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = () => { setFormData({ isActive: true }); setEditMode(false); setDialogOpen(true); };
  const handleEdit = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteOpen(true); };

  const handleDelete = async () => {
    const t = thunkMap[tabKey]; if (!t?.remove) return;
    const r = await dispatch(t.remove(selectedId));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Deleted'); setDeleteOpen(false); loadData(); }
    else showError(r.payload || 'Failed');
  };

  const handleSubmit = async () => {
    const t = thunkMap[tabKey]; if (!t) return;
    if (editMode && t.update) {
      const r = await dispatch(t.update({ id: selectedId, data: formData }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    } else {
      if (tabKey === 'applications') {
        const r = await dispatch(createLeaveApp(formData));
        if (r.meta.requestStatus === 'fulfilled') { showSuccess('Leave application submitted'); setDialogOpen(false); loadData(); }
        else showError(r.payload || 'Failed');
      } else {
        const r = await dispatch(t.create(formData));
        if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadData(); }
        else showError(r.payload || 'Failed');
      }
    }
  };

  const handleApprove = async (id) => {
    try { await LeaveApplicationApi.approve(id); showSuccess('Approved'); loadData(); }
    catch (e) { showError('Approval failed'); }
  };
  const handleReject = (id) => {
    setRejectId(id);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejectConfirm = async () => {
    try {
      await LeaveApplicationApi.reject(rejectId, rejectReason || '');
      showSuccess('Rejected');
      setRejectOpen(false);
      loadData();
    } catch (e) { showError('Rejection failed'); }
  };

  const { list = [], loading, saving } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  // ── Render tables ──
  const renderAppTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>App #</TableCell><TableCell>Employee</TableCell><TableCell>Leave Type</TableCell><TableCell>Dates</TableCell><TableCell>Days</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No leave applications</Typography></TableCell></TableRow> :
        list.map(a => (
          <TableRow key={a.id} hover>
            <TableCell><Chip label={a.applicationNumber} size="small" variant="outlined" /></TableCell>
            <TableCell><Typography fontWeight={600}>{a.employee?.name || '—'}</Typography></TableCell>
            <TableCell>{a.leaveType?.name || '—'}</TableCell>
            <TableCell>{a.startDate} → {a.endDate}</TableCell>
            <TableCell>{a.totalDays}</TableCell>
            <TableCell><Chip label={a.status} size="small" color={STATUS_COLORS[a.status] || 'default'} /></TableCell>
            <TableCell align="right">
              {a.status === 'Submitted' && (
                <><Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(a.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(a.id)}><RejectIcon fontSize="small" /></IconButton></Tooltip></>
              )}
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(a.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderBalanceTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Leave Type</TableCell><TableCell>Year</TableCell><TableCell>Opening</TableCell><TableCell>Accrued</TableCell><TableCell>Used</TableCell><TableCell>Pending</TableCell><TableCell>Available</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No balances</Typography></TableCell></TableRow> :
        list.map(b => (
          <TableRow key={b.id} hover>
            <TableCell><Typography fontWeight={600}>{b.employee?.name || '—'}</Typography></TableCell>
            <TableCell>{b.leaveType?.name || '—'}</TableCell>
            <TableCell>{b.year}</TableCell>
            <TableCell>{b.openingBalance}</TableCell>
            <TableCell>{b.accruedDays}</TableCell>
            <TableCell>{b.usedDays}</TableCell>
            <TableCell>{b.pendingDays}</TableCell>
            <TableCell><Chip label={b.availableBalance} size="small" color={b.availableBalance > 0 ? 'success' : 'error'} /></TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderTypeTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Max Days/Year</TableCell><TableCell>Paid</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No leave types</Typography></TableCell></TableRow> :
        list.map(lt => (
          <TableRow key={lt.id} hover>
            <TableCell><Chip label={lt.code} size="small" variant="outlined" /></TableCell>
            <TableCell><Typography fontWeight={600}>{lt.name}</Typography></TableCell>
            <TableCell><Chip label={lt.leaveCategory} size="small" color="primary" variant="outlined" /></TableCell>
            <TableCell>{lt.maxDaysPerYear || 'Unlimited'}</TableCell>
            <TableCell>{lt.isPaid ? 'Yes' : 'No'}</TableCell>
            <TableCell><Chip label={lt.isActive ? 'Active' : 'Inactive'} size="small" color={lt.isActive ? 'success' : 'default'} /></TableCell>
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(lt)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(lt.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderHolidayTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Recurring</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No holidays</Typography></TableCell></TableRow> :
        list.map(h => (
          <TableRow key={h.id} hover>
            <TableCell><Typography fontWeight={600}>{h.name}</Typography></TableCell>
            <TableCell>{h.holidayDate}{h.endDate && ` → ${h.endDate}`}</TableCell>
            <TableCell><Chip label={h.holidayType} size="small" variant="outlined" /></TableCell>
            <TableCell>{h.isRecurringYearly ? 'Yes' : 'No'}</TableCell>
            <TableCell><Chip label={h.isActive ? 'Active' : 'Inactive'} size="small" color={h.isActive ? 'success' : 'default'} /></TableCell>
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(h)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(h.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderTable = () => {
    switch (tabKey) { case 'applications': return renderAppTable(); case 'balances': return renderBalanceTable(); case 'types': return renderTypeTable(); case 'holidays': return renderHolidayTable(); default: return null; }
  };

  const renderFormFields = () => {
    switch (tabKey) {
      case 'applications':
        return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
          <Grid item xs={6}><LeaveTypeSelect value={formData.leaveTypeId} onChange={v => setFormData({ ...formData, leaveTypeId: v })} label="Leave Type" required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Start Date *" type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="End Date *" type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={3} value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} /></Grid>
        </Grid>);
      case 'types':
        return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth size="small" label="Category *" value={formData.leaveCategory || ''} onChange={e => setFormData({ ...formData, leaveCategory: e.target.value })}>{LEAVE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
          <Grid item xs={3}><TextField fullWidth size="small" label="Max Days/Year" type="number" value={formData.maxDaysPerYear || ''} onChange={e => setFormData({ ...formData, maxDaysPerYear: e.target.value ? parseFloat(e.target.value) : null })} /></Grid>
          <Grid item xs={3}><TextField fullWidth size="small" label="Max/Request" type="number" value={formData.maxDaysPerRequest || ''} onChange={e => setFormData({ ...formData, maxDaysPerRequest: e.target.value ? parseFloat(e.target.value) : null })} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
        </Grid>);
      case 'balances':
        return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
          <Grid item xs={6}><LeaveTypeSelect value={formData.leaveTypeId} onChange={v => setFormData({ ...formData, leaveTypeId: v })} label="Leave Type" required /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Year *" type="number" value={formData.year || new Date().getFullYear()} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Opening Balance" type="number" value={formData.openingBalance || 0} onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) })} /></Grid>
          <Grid item xs={4}><TextField fullWidth size="small" label="Accrued Days" type="number" value={formData.accruedDays || 0} onChange={e => setFormData({ ...formData, accruedDays: parseFloat(e.target.value) })} /></Grid>
        </Grid>);
      case 'holidays':
        return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth size="small" label="Type" value={formData.holidayType || 'Public'} onChange={e => setFormData({ ...formData, holidayType: e.target.value })}>{HOLIDAY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Date *" type="date" value={formData.holidayDate || ''} onChange={e => setFormData({ ...formData, holidayDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="End Date" type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Description" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
        </Grid>);
      default: return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Leave Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Manage leave applications, balances, types, and holidays</Typography>

      {tabKey === 'applications' && appsSummary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="info.main">{appsSummary.submitted || 0}</Typography><Typography variant="caption">Submitted</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="success.main">{appsSummary.approved || 0}</Typography><Typography variant="caption">Approved</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5" color="error.main">{appsSummary.rejected || 0}</Typography><Typography variant="caption">Rejected</Typography></CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card><CardContent sx={{ textAlign: 'center', py: 1.5 }}><Typography variant="h5">{appsSummary.total || 0}</Typography><Typography variant="caption">Total</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <Tabs value={tabKey} onChange={(e, v) => { setTabKey(v); setPage(0); setSearch(''); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(t => <Tab key={t.key} value={t.key} icon={t.icon} label={t.label} iconPosition="start" />)}
      </Tabs>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <><TableContainer>{renderTable()}</TableContainer>
            <TablePagination component="div" count={pagination.total || 0} page={page}
              onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} /></>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit' : 'Add'} {TABS.find(t => t.key === tabKey)?.label?.replace(/s$/, '')}</DialogTitle>
        <DialogContent dividers>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>{saving ? <CircularProgress size={20} /> : (editMode ? 'Update' : 'Create')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure? This action cannot be undone.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" variant="contained" onClick={handleDelete}>Delete</Button></DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Leave Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Please provide a reason for rejection (optional):</Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRejectConfirm}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeavePage;
