import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Edit, LocationOn as LocIcon, Block, CheckCircle } from '@mui/icons-material';
import { fetchLocations, createLocation, updateLocation, toggleLocationStatus, deleteLocation, clearError } from '../store/slices/assetLocationSlice';

const LOC_TYPES = [{ value: 'building', label: 'Building' }, { value: 'floor', label: 'Floor' }, { value: 'room', label: 'Room' }, { value: 'clinic', label: 'Clinic' }, { value: 'department', label: 'Department' }, { value: 'warehouse', label: 'Warehouse' }];
const INITIAL_FORM = { locationCode: '', locationName: '', locationType: 'building', parentId: '', description: '', isActive: true };

const AssetLocations = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [form, setForm] = useState(INITIAL_FORM); const [fErrors, setFErrors] = useState({}); const [del, setDel] = useState(null); const [editingId, setEditingId] = useState(null);
  const { locations, loading, error } = useSelector((s) => s.locations);

  const load = useCallback(() => { dispatch(fetchLocations({ search })); }, [dispatch, search]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const openCreate = () => { setEditingId(null); setForm(INITIAL_FORM); setDialogOpen(true); };
  const openEdit = (m) => { setEditingId(m.id); setForm({ locationCode: m.locationCode, locationName: m.locationName, locationType: m.locationType, parentId: m.parentId || '', description: m.description || '', isActive: m.isActive }); setDialogOpen(true); };

  const handleSubmit = async () => { const e = {}; if (!form.locationCode.trim()) e.locationCode = 'Required'; if (!form.locationName.trim()) e.locationName = 'Required'; if (!form.locationType) e.locationType = 'Required'; setFErrors(e); if (Object.keys(e).length > 0) return;
    const d = { ...form, parentId: form.parentId || null, description: form.description || null };
    if (editingId) { await dispatch(updateLocation({ id: editingId, data: d })); } else { await dispatch(createLocation(d)); } setDialogOpen(false); setEditingId(null); };

  const gl = (a, v) => a.find((x) => x.value === v)?.label || v;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocIcon color="primary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Locations</Typography><Typography variant="body2" color="text.secondary">Manage buildings, floors, rooms, clinics</Typography></Box></Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Location</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={load}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); dispatch(fetchLocations({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}><Table>
          <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Code</TableCell><TableCell sx={{ fontWeight: 600 }}>Name</TableCell><TableCell sx={{ fontWeight: 600 }}>Type</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>{locations.length === 0 ? (<TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No locations found.</Typography></TableCell></TableRow>) : locations.map((m) => (
            <TableRow key={m.id} hover><TableCell><Typography variant="body2" fontWeight={600}>{m.locationCode}</Typography></TableCell><TableCell>{m.locationName}</TableCell><TableCell><Chip label={gl(LOC_TYPES, m.locationType)} size="small" variant="outlined" /></TableCell>
            <TableCell><Chip label={m.isActive ? 'Active' : 'Inactive'} color={m.isActive ? 'success' : 'default'} size="small" /></TableCell>
            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title={m.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" color={m.isActive ? 'warning' : 'success'} onClick={() => dispatch(toggleLocationStatus(m.id))}>{m.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}</IconButton></Tooltip>
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDel(m.id)}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box></TableCell></TableRow>))}</TableBody>
        </Table></TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocIcon color="primary" /><Typography variant="h6">{editingId ? 'Edit Location' : 'New Location'}</Typography></Box></DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Code" value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} required error={!!fErrors.locationCode} helperText={fErrors.locationCode} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth size="small" required error={!!fErrors.locationType}><InputLabel>Type</InputLabel><Select value={form.locationType} label="Type" onChange={(e) => setForm({ ...form, locationType: e.target.value })}>{LOC_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Name" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} required error={!!fErrors.locationName} helperText={fErrors.locationName} /></Grid>
          <Grid item xs={12}><FormControl fullWidth size="small"><InputLabel>Parent Location</InputLabel><Select value={form.parentId} label="Parent Location" onChange={(e) => setForm({ ...form, parentId: e.target.value })}><MenuItem value=""><em>None</em></MenuItem>{locations.filter((l) => l.id !== editingId).map((l) => <MenuItem key={l.id} value={l.id}>{l.locationCode} - {l.locationName}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => { setDialogOpen(false); setEditingId(null); }}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!del} onClose={() => setDel(null)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Delete this location?</Typography></DialogContent><DialogActions><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (del) { await dispatch(deleteLocation(del)); setDel(null); } }}>Delete</Button></DialogActions></Dialog>
    </Box>
  );
};
export default AssetLocations;
