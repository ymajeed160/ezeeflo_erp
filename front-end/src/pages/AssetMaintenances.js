import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, Edit, Build as MaintIcon } from '@mui/icons-material';
import { fetchMaintenances, fetchMaintenance, createMaintenance, updateMaintenance, deleteMaintenance, fetchNextMaintenanceNumber, clearError, clearSelected } from '../store/slices/assetMaintenanceSlice';
import { fetchAssets } from '../store/slices/assetSlice';
import { formatCurrency } from '../utils/currency';

const MAINT_TYPES = [
  { value: 'preventive', label: 'Preventive', color: 'info' },
  { value: 'corrective', label: 'Corrective', color: 'warning' },
  { value: 'amc', label: 'AMC Contract', color: 'success' },
];
const STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'info' },
  { value: 'in_progress', label: 'In Progress', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

const INITIAL_FORM = { maintenanceNumber: '', assetId: '', maintenanceType: 'preventive', title: '', description: '', serviceProvider: '', maintenanceDate: '', nextDueDate: '', cost: '', status: 'scheduled', notes: '' };

const AssetMaintenances = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM); const [formErrors, setFormErrors] = useState({}); const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const { maintenances, selectedMaintenance, nextMaintenanceNumber, loading, error } = useSelector((s) => s.maintenances);
  const { assets } = useSelector((s) => s.assets);

  const loadData = useCallback(() => { const p = { search }; if (statusFilter) p.status = statusFilter; dispatch(fetchMaintenances(p)); }, [dispatch, search, statusFilter]);
  useEffect(() => { loadData(); dispatch(fetchAssets({ limit: 999 })); }, [loadData]);
  useEffect(() => { if (dialogOpen && !editingId) dispatch(fetchNextMaintenanceNumber()); }, [dialogOpen, editingId, dispatch]);
  useEffect(() => { if (nextMaintenanceNumber && !editingId) setForm((p) => ({ ...p, maintenanceNumber: nextMaintenanceNumber })); }, [nextMaintenanceNumber, editingId]);
  useEffect(() => { if (selectedMaintenance && !dialogOpen) setViewDialogOpen(true); }, [selectedMaintenance, dialogOpen]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const openCreate = () => { setEditingId(null); setForm(INITIAL_FORM); setDialogOpen(true); };
  const openEdit = (m) => { setEditingId(m.id); setForm({ maintenanceNumber: m.maintenanceNumber, assetId: m.assetId, maintenanceType: m.maintenanceType, title: m.title, description: m.description || '', serviceProvider: m.serviceProvider || '', maintenanceDate: m.maintenanceDate || '', nextDueDate: m.nextDueDate || '', cost: m.cost ?? '', status: m.status, notes: m.notes || '' }); setDialogOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.assetId) e.assetId = 'Asset required';
    if (!form.title.trim()) e.title = 'Title required';
    setFormErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = { ...form, cost: form.cost === '' ? 0 : parseFloat(form.cost), maintenanceDate: form.maintenanceDate || null, nextDueDate: form.nextDueDate || null };
    if (editingId) { await dispatch(updateMaintenance({ id: editingId, data })); } else { await dispatch(createMaintenance(data)); }
    setDialogOpen(false); setEditingId(null);
  };

  const getLabel = (arr, val) => arr.find((a) => a.value === val)?.label || val;
  const getColor = (arr, val) => arr.find((a) => a.value === val)?.color || 'default';
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MaintIcon color="primary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Maintenance</Typography><Typography variant="body2" color="text.secondary">Preventive, corrective, and AMC contract management</Typography></Box></Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Maintenance</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="">All</MenuItem>{STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setStatusFilter(''); dispatch(fetchMaintenances({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>#</TableCell><TableCell sx={{ fontWeight: 600 }}>Title</TableCell><TableCell sx={{ fontWeight: 600 }}>Asset</TableCell><TableCell sx={{ fontWeight: 600 }}>Type</TableCell><TableCell sx={{ fontWeight: 600 }}>Provider</TableCell><TableCell sx={{ fontWeight: 600 }}>Date</TableCell><TableCell sx={{ fontWeight: 600 }}>Cost</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {maintenances.length === 0 ? (<TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No maintenance records found.</Typography></TableCell></TableRow>
              ) : maintenances.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{m.maintenanceNumber}</Typography></TableCell>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>{m.asset?.assetName || '-'}</TableCell>
                  <TableCell><Chip label={getLabel(MAINT_TYPES, m.maintenanceType)} color={getColor(MAINT_TYPES, m.maintenanceType)} size="small" variant="outlined" /></TableCell>
                  <TableCell>{m.serviceProvider || '-'}</TableCell>
                  <TableCell>{m.maintenanceDate || '-'}</TableCell>
                  <TableCell>{formatCurrency(m.cost)}</TableCell>
                  <TableCell><Chip label={getLabel(STATUSES, m.status)} color={getColor(STATUSES, m.status)} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchMaintenance(m.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(m.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MaintIcon color="primary" /><Typography variant="h6">{editingId ? 'Edit Maintenance' : 'New Maintenance'}</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Maintenance #" value={form.maintenanceNumber} onChange={(e) => setForm({ ...form, maintenanceNumber: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={form.maintenanceType} label="Type" onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}>{MAINT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><FormControl fullWidth size="small" required error={!!formErrors.assetId}><InputLabel>Asset</InputLabel><Select value={form.assetId} label="Asset" onChange={(e) => setForm({ ...form, assetId: e.target.value })}><MenuItem value=""><em>Select</em></MenuItem>{assets?.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required error={!!formErrors.title} helperText={formErrors.title} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Service Provider" value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Date" type="date" value={form.maintenanceDate} onChange={(e) => setForm({ ...form, maintenanceDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Next Due Date" type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => { setDialogOpen(false); setEditingId(null); }}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MaintIcon color="primary" /><Typography variant="h6">Maintenance Details</Typography></Box></DialogTitle>
        <DialogContent dividers>{selectedMaintenance && (
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Maintenance #</Typography><Typography variant="body1" fontWeight={600}>{selectedMaintenance.maintenanceNumber}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Type</Typography><Chip label={getLabel(MAINT_TYPES, selectedMaintenance.maintenanceType)} color={getColor(MAINT_TYPES, selectedMaintenance.maintenanceType)} size="small" sx={{ mt: 0.5 }} /></Grid>
            <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedMaintenance.asset?.assetName || selectedMaintenance.assetId}</Typography></Grid>
            <Grid item xs={12}><Typography variant="caption" color="text.secondary">Title</Typography><Typography variant="body1">{selectedMaintenance.title}</Typography></Grid>
            {selectedMaintenance.description && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Description</Typography><Typography variant="body1">{selectedMaintenance.description}</Typography></Grid>}
            {selectedMaintenance.serviceProvider && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Provider</Typography><Typography variant="body1">{selectedMaintenance.serviceProvider}</Typography></Grid>}
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Cost</Typography><Typography variant="body1">{formatCurrency(selectedMaintenance.cost)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{selectedMaintenance.maintenanceDate || '-'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Next Due</Typography><Typography variant="body1">{selectedMaintenance.nextDueDate || '-'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip label={getLabel(STATUSES, selectedMaintenance.status)} color={getColor(STATUSES, selectedMaintenance.status)} size="small" /></Box></Grid>
            {selectedMaintenance.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body1">{selectedMaintenance.notes}</Typography></Grid>}
          </Grid>
        )}</DialogContent>
        <DialogActions><Button onClick={() => { setViewDialogOpen(false); }}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this maintenance record?</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (deleteConfirm) { await dispatch(deleteMaintenance(deleteConfirm)); setDeleteConfirm(null); } }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetMaintenances;
