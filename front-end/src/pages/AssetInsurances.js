import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, Edit, Shield as InsIcon } from '@mui/icons-material';
import { fetchInsurances, fetchInsurance, createInsurance, updateInsurance, deleteInsurance, fetchNextInsuranceNumber, clearError, clearSelected } from '../store/slices/assetInsuranceSlice';
import { fetchAssets } from '../store/slices/assetSlice';
import { formatCurrency } from '../utils/currency';

const STATUSES = [{ value: 'active', label: 'Active', color: 'success' }, { value: 'expired', label: 'Expired', color: 'error' }, { value: 'cancelled', label: 'Cancelled', color: 'default' }];
const INITIAL_FORM = { insuranceNumber: '', assetId: '', insuranceCompany: '', policyNumber: '', premium: '', coverageAmount: '', startDate: '', expiryDate: '', renewalReminderDays: 30, notes: '', status: 'active' };

const AssetInsurances = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState(''); const [sFilter, setSFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM); const [fErrors, setFErrors] = useState({}); const [del, setDel] = useState(null); const [editingId, setEditingId] = useState(null);
  const { insurances, selectedInsurance, nextInsuranceNumber, loading, error } = useSelector((s) => s.insurances);
  const { assets } = useSelector((s) => s.assets);

  const load = useCallback(() => { const p = { search }; if (sFilter) p.status = sFilter; dispatch(fetchInsurances(p)); }, [dispatch, search, sFilter]);
  useEffect(() => { load(); dispatch(fetchAssets({ limit: 999 })); }, [load]);
  useEffect(() => { if (dialogOpen && !editingId) dispatch(fetchNextInsuranceNumber()); }, [dialogOpen, editingId, dispatch]);
  useEffect(() => { if (nextInsuranceNumber && !editingId) setForm((p) => ({ ...p, insuranceNumber: nextInsuranceNumber })); }, [nextInsuranceNumber, editingId]);
  useEffect(() => { if (selectedInsurance && !dialogOpen) setViewOpen(true); }, [selectedInsurance, dialogOpen]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const openCreate = () => { setEditingId(null); setForm(INITIAL_FORM); setDialogOpen(true); };
  const openEdit = (m) => { setEditingId(m.id); setForm({ insuranceNumber: m.insuranceNumber, assetId: m.assetId, insuranceCompany: m.insuranceCompany, policyNumber: m.policyNumber, premium: m.premium ?? '', coverageAmount: m.coverageAmount ?? '', startDate: m.startDate || '', expiryDate: m.expiryDate || '', renewalReminderDays: m.renewalReminderDays || 30, notes: m.notes || '', status: m.status }); setDialogOpen(true); };

  const handleSubmit = async () => { const e = {}; if (!form.assetId) e.assetId = 'Required'; if (!form.insuranceCompany.trim()) e.insuranceCompany = 'Required'; if (!form.policyNumber.trim()) e.policyNumber = 'Required'; setFErrors(e); if (Object.keys(e).length > 0) return;
    const d = { ...form, premium: form.premium === '' ? 0 : parseFloat(form.premium), coverageAmount: form.coverageAmount === '' ? 0 : parseFloat(form.coverageAmount), startDate: form.startDate || null, expiryDate: form.expiryDate || null };
    if (editingId) { await dispatch(updateInsurance({ id: editingId, data: d })); } else { await dispatch(createInsurance(d)); } setDialogOpen(false); setEditingId(null); };

  const gl = (a, v) => a.find((x) => x.value === v)?.label || v; const gc = (a, v) => a.find((x) => x.value === v)?.color || 'default';
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><InsIcon color="primary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Insurance</Typography><Typography variant="body2" color="text.secondary">Manage insurance policies for assets</Typography></Box></Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Insurance</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={sFilter} label="Status" onChange={(e) => setSFilter(e.target.value)}><MenuItem value="">All</MenuItem>{STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={load}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setSFilter(''); dispatch(fetchInsurances({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}><Table>
          <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>#</TableCell><TableCell sx={{ fontWeight: 600 }}>Company</TableCell><TableCell sx={{ fontWeight: 600 }}>Policy #</TableCell><TableCell sx={{ fontWeight: 600 }}>Asset</TableCell><TableCell sx={{ fontWeight: 600 }}>Premium</TableCell><TableCell sx={{ fontWeight: 600 }}>Coverage</TableCell><TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow></TableHead>
          <TableBody>{insurances.length === 0 ? (<TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No insurance records found.</Typography></TableCell></TableRow>) : insurances.map((m) => (
            <TableRow key={m.id} hover><TableCell><Typography variant="body2" fontWeight={600}>{m.insuranceNumber}</Typography></TableCell><TableCell>{m.insuranceCompany}</TableCell><TableCell>{m.policyNumber}</TableCell><TableCell>{m.asset?.assetName || '-'}</TableCell><TableCell>{formatCurrency(m.premium)}</TableCell><TableCell>{formatCurrency(m.coverageAmount)}</TableCell><TableCell><Typography color={m.expiryDate && new Date(m.expiryDate) < new Date() ? 'error.main' : 'inherit'}>{m.expiryDate || '-'}</Typography></TableCell><TableCell><Chip label={gl(STATUSES, m.status)} color={gc(STATUSES, m.status)} size="small" /></TableCell>
            <TableCell align="center"><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchInsurance(m.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDel(m.id)}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box></TableCell></TableRow>))}</TableBody>
        </Table></TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><InsIcon color="primary" /><Typography variant="h6">{editingId ? 'Edit Insurance' : 'New Insurance'}</Typography></Box></DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Insurance #" value={form.insuranceNumber} onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12}><FormControl fullWidth size="small" required error={!!fErrors.assetId}><InputLabel>Asset</InputLabel><Select value={form.assetId} label="Asset" onChange={(e) => setForm({ ...form, assetId: e.target.value })}><MenuItem value=""><em>Select</em></MenuItem>{assets?.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Insurance Company" value={form.insuranceCompany} onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })} required error={!!fErrors.insuranceCompany} helperText={fErrors.insuranceCompany} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Policy Number" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} required error={!!fErrors.policyNumber} helperText={fErrors.policyNumber} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Premium" type="number" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Coverage Amount" type="number" value={form.coverageAmount} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Renewal Reminder (days)" type="number" value={form.renewalReminderDays} onChange={(e) => setForm({ ...form, renewalReminderDays: parseInt(e.target.value) || 30 })} inputProps={{ min: 0 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => { setDialogOpen(false); setEditingId(null); }}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => { setViewOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><InsIcon color="primary" /><Typography variant="h6">Insurance Details</Typography></Box></DialogTitle>
        <DialogContent dividers>{selectedInsurance && (<Grid container spacing={2}>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Insurance #</Typography><Typography variant="body1" fontWeight={600}>{selectedInsurance.insuranceNumber}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={gl(STATUSES, selectedInsurance.status)} color={gc(STATUSES, selectedInsurance.status)} size="small" sx={{ mt: 0.5 }} /></Grid>
          <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedInsurance.asset?.assetName || selectedInsurance.assetId}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Company</Typography><Typography variant="body1">{selectedInsurance.insuranceCompany}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Policy #</Typography><Typography variant="body1">{selectedInsurance.policyNumber}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Premium</Typography><Typography variant="body1">{formatCurrency(selectedInsurance.premium)}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Coverage</Typography><Typography variant="body1">{formatCurrency(selectedInsurance.coverageAmount)}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Start</Typography><Typography variant="body1">{selectedInsurance.startDate || '-'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Expiry</Typography><Typography variant="body1">{selectedInsurance.expiryDate || '-'}</Typography></Grid>
          {selectedInsurance.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body1">{selectedInsurance.notes}</Typography></Grid>}
        </Grid>)}</DialogContent>
        <DialogActions><Button onClick={() => { setViewOpen(false); }}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!del} onClose={() => setDel(null)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Delete this insurance record?</Typography></DialogContent><DialogActions><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (del) { await dispatch(deleteInsurance(del)); setDel(null); } }}>Delete</Button></DialogActions></Dialog>
    </Box>
  );
};
export default AssetInsurances;
