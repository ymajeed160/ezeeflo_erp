import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, SwapHoriz as TransferIcon } from '@mui/icons-material';
import { fetchTransfers, createTransfer, deleteTransfer, fetchNextTransferNumber, clearError, clearSelected } from '../store/slices/assetTransferSlice';
import { fetchAssets } from '../store/slices/assetSlice';

const INITIAL_FORM = { transferNumber: '', transferDate: new Date().toISOString().split('T')[0], assetId: '', toLocation: '', toDepartment: '', toCustodian: '', toWarehouse: '', toBranch: '', reason: '' };

const AssetTransfers = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM); const [formErrors, setFormErrors] = useState({}); const [deleteConfirm, setDeleteConfirm] = useState(null); const [viewTransfer, setViewTransfer] = useState(null);
  const { transfers, selectedTransfer, nextTransferNumber, loading, error } = useSelector((s) => s.assetTransfers);
  const { assets } = useSelector((s) => s.assets);
  const activeAssets = assets?.filter((a) => a.status === 'active') || [];

  const loadData = useCallback(() => { dispatch(fetchTransfers({ search })); }, [dispatch, search]);
  useEffect(() => { loadData(); dispatch(fetchAssets({ status: 'active', limit: 999 })); }, [loadData]);
  useEffect(() => { if (dialogOpen) dispatch(fetchNextTransferNumber()); }, [dialogOpen, dispatch]);
  useEffect(() => { if (nextTransferNumber) setForm((p) => ({ ...p, transferNumber: nextTransferNumber })); }, [nextTransferNumber]);
  useEffect(() => { if (selectedTransfer) { setViewTransfer(selectedTransfer); setViewDialogOpen(true); } }, [selectedTransfer]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.assetId) errors.assetId = 'Asset is required';
    if (!form.toLocation && !form.toDepartment && !form.toCustodian && !form.toWarehouse && !form.toBranch) errors.destination = 'At least one destination field required';
    setFormErrors(errors); return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await dispatch(createTransfer({ ...form, transferDate: form.transferDate || null, reason: form.reason || null, toLocation: form.toLocation || null, toDepartment: form.toDepartment || null, toCustodian: form.toCustodian || null, toWarehouse: form.toWarehouse || null, toBranch: form.toBranch || null }));
    setDialogOpen(false);
  };

  const handleDelete = async () => { if (deleteConfirm) { await dispatch(deleteTransfer(deleteConfirm)); setDeleteConfirm(null); } };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon color="primary" sx={{ fontSize: 32 }} />
          <Box><Typography variant="h5" fontWeight={700}>Asset Transfers</Typography><Typography variant="body2" color="text.secondary">Transfer assets between locations, departments, and custodians</Typography></Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Transfer</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" placeholder="Search by transfer number..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); dispatch(fetchTransfers({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Transfer #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No transfers found.</Typography></TableCell></TableRow>
              ) : transfers.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{t.transferNumber}</Typography></TableCell>
                  <TableCell>{t.transferDate}</TableCell>
                  <TableCell>{t.asset?.assetName || t.asset?.assetCode || '-'}</TableCell>
                  <TableCell><Typography variant="caption">{t.fromLocation || t.fromDepartment || t.fromCustodian || '-'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600} color="primary.main">{t.toLocation || t.toDepartment || t.toCustodian || t.toWarehouse || '-'}</Typography></TableCell>
                  <TableCell><Chip label={t.isCompleted ? 'Completed' : 'Draft'} color={t.isCompleted ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchTransfer(t.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(t.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TransferIcon color="primary" /><Typography variant="h6">New Asset Transfer</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Transfer #" value={form.transferNumber} onChange={(e) => setForm({ ...form, transferNumber: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Date" type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required error={!!formErrors.assetId}>
                <InputLabel>Asset</InputLabel>
                <Select value={form.assetId} label="Asset" onChange={(e) => {
                  const asset = activeAssets.find((a) => a.id === e.target.value);
                  setForm({ ...form, assetId: e.target.value, fromLocation: asset?.location || '', fromDepartment: asset?.department || '' });
                }}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {activeAssets.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Current</Typography></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Current Location" value={form.fromLocation} InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Current Department" value={form.fromDepartment} InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Transfer To</Typography></Grid>
            {formErrors.destination && <Grid item xs={12}><Alert severity="error">{formErrors.destination}</Alert></Grid>}
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="New Location" value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="New Department" value={form.toDepartment} onChange={(e) => setForm({ ...form, toDepartment: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="New Custodian" value={form.toCustodian} onChange={(e) => setForm({ ...form, toCustodian: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="New Warehouse" value={form.toWarehouse} onChange={(e) => setForm({ ...form, toWarehouse: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="New Branch" value={form.toBranch} onChange={(e) => setForm({ ...form, toBranch: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); setViewTransfer(null); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TransferIcon color="primary" /><Typography variant="h6">Transfer Details</Typography></Box></DialogTitle>
        <DialogContent dividers>
          {viewTransfer && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Transfer #</Typography><Typography variant="body1" fontWeight={600}>{viewTransfer.transferNumber}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{viewTransfer.transferDate}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{viewTransfer.asset?.assetName || viewTransfer.assetId}</Typography></Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">From Location</Typography>
                <Typography variant="body1">{viewTransfer.fromLocation || '-'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>From Department</Typography>
                <Typography variant="body1">{viewTransfer.fromDepartment || '-'}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>From Custodian</Typography>
                <Typography variant="body1">{viewTransfer.fromCustodian || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="primary" fontWeight={600}>To Location</Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">{viewTransfer.toLocation || '-'}</Typography>
                <Typography variant="caption" color="primary" fontWeight={600} display="block" sx={{ mt: 1 }}>To Department</Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">{viewTransfer.toDepartment || '-'}</Typography>
                <Typography variant="caption" color="primary" fontWeight={600} display="block" sx={{ mt: 1 }}>To Custodian</Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">{viewTransfer.toCustodian || '-'}</Typography>
              </Grid>
              {viewTransfer.reason && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Reason</Typography><Typography variant="body1">{viewTransfer.reason}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewDialogOpen(false); setViewTransfer(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this transfer record? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetTransfers;
