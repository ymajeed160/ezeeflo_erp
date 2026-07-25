import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Edit, Person as CustIcon, Block, CheckCircle } from '@mui/icons-material';
import { fetchCustodians, createCustodian, updateCustodian, toggleCustodianStatus, deleteCustodian, clearError } from '../store/slices/assetCustodianSlice';

const CUST_TYPES = [{ value: 'employee', label: 'Employee' }, { value: 'doctor', label: 'Doctor' }, { value: 'department', label: 'Department' }];
const INITIAL_FORM = { custodianCode: '', custodianName: '', custodianType: 'employee', email: '', phone: '', department: '', isActive: true };

const AssetCustodians = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [form, setForm] = useState(INITIAL_FORM); const [fErrors, setFErrors] = useState({}); const [del, setDel] = useState(null); const [editingId, setEditingId] = useState(null);
  const { custodians, loading, error } = useSelector((s) => s.custodians);

  const load = useCallback(() => { dispatch(fetchCustodians({ search })); }, [dispatch, search]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const openCreate = () => { setEditingId(null); setForm(INITIAL_FORM); setDialogOpen(true); };
  const openEdit = (m) => { setEditingId(m.id); setForm({ custodianCode: m.custodianCode, custodianName: m.custodianName, custodianType: m.custodianType, email: m.email || '', phone: m.phone || '', department: m.department || '', isActive: m.isActive }); setDialogOpen(true); };

  const handleSubmit = async () => { const e = {}; if (!form.custodianCode.trim()) e.custodianCode = 'Required'; if (!form.custodianName.trim()) e.custodianName = 'Required'; if (!form.custodianType) e.custodianType = 'Required'; setFErrors(e); if (Object.keys(e).length > 0) return;
    const d = { ...form, email: form.email || null, phone: form.phone || null, department: form.department || null };
    if (editingId) { await dispatch(updateCustodian({ id: editingId, data: d })); } else { await dispatch(createCustodian(d)); } setDialogOpen(false); setEditingId(null); };

  const gl = (a, v) => a.find((x) => x.value === v)?.label || v;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CustIcon color="primary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Custodians</Typography><Typography variant="body2" color="text.secondary">Manage employees, doctors, and departments responsible for assets</Typography></Box></Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Custodian</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={load}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); dispatch(fetchCustodians({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}><Table>
          <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Code</TableCell><TableCell sx={{ fontWeight: 600 }}>Name</TableCell><TableCell sx={{ fontWeight: 600 }}>Type</TableCell><TableCell sx={{ fontWeight: 600 }}>Email</TableCell><TableCell sx={{ fontWeight: 600 }}>Phone</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>{custodians.length === 0 ? (<TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No custodians found.</Typography></TableCell></TableRow>) : custodians.map((m) => (
            <TableRow key={m.id} hover><TableCell><Typography variant="body2" fontWeight={600}>{m.custodianCode}</Typography></TableCell><TableCell>{m.custodianName}</TableCell><TableCell><Chip label={gl(CUST_TYPES, m.custodianType)} size="small" variant="outlined" /></TableCell><TableCell>{m.email || '-'}</TableCell><TableCell>{m.phone || '-'}</TableCell>
            <TableCell><Chip label={m.isActive ? 'Active' : 'Inactive'} color={m.isActive ? 'success' : 'default'} size="small" /></TableCell>
            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title={m.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" color={m.isActive ? 'warning' : 'success'} onClick={() => dispatch(toggleCustodianStatus(m.id))}>{m.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}</IconButton></Tooltip>
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDel(m.id)}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box></TableCell></TableRow>))}</TableBody>
        </Table></TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CustIcon color="primary" /><Typography variant="h6">{editingId ? 'Edit Custodian' : 'New Custodian'}</Typography></Box></DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Code" value={form.custodianCode} onChange={(e) => setForm({ ...form, custodianCode: e.target.value })} required error={!!fErrors.custodianCode} helperText={fErrors.custodianCode} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth size="small" required error={!!fErrors.custodianType}><InputLabel>Type</InputLabel><Select value={form.custodianType} label="Type" onChange={(e) => setForm({ ...form, custodianType: e.target.value })}>{CUST_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Name" value={form.custodianName} onChange={(e) => setForm({ ...form, custodianName: e.target.value })} required error={!!fErrors.custodianName} helperText={fErrors.custodianName} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => { setDialogOpen(false); setEditingId(null); }}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!del} onClose={() => setDel(null)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Delete this custodian?</Typography></DialogContent><DialogActions><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (del) { await dispatch(deleteCustodian(del)); setDel(null); } }}>Delete</Button></DialogActions></Dialog>
    </Box>
  );
};
export default AssetCustodians;
