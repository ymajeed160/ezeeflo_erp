import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, PostAdd, TrendingUp as RevalIcon } from '@mui/icons-material';
import { fetchRevaluations, fetchRevaluation, createRevaluation, postRevaluation, deleteRevaluation, fetchNextRevaluationNumber, clearError, clearSelected } from '../store/slices/assetRevaluationSlice';
import { fetchAssets } from '../store/slices/assetSlice';
import { formatCurrency } from '../utils/currency';

const AssetRevaluations = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState({ revaluationNumber: '', assetId: '', revaluationDate: new Date().toISOString().split('T')[0], revaluationType: 'increase', revaluationAmount: '', reason: '' });
  const [formErrors, setFormErrors] = useState({}); const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { revaluations, selectedRevaluation, nextRevaluationNumber, loading, error } = useSelector((s) => s.revaluations);
  const { assets } = useSelector((s) => s.assets);
  const activeAssets = assets?.filter((a) => a.status === 'active') || [];

  const loadData = useCallback(() => { dispatch(fetchRevaluations({ search })); }, [dispatch, search]);
  useEffect(() => { loadData(); dispatch(fetchAssets({ limit: 999 })); }, [loadData]);
  useEffect(() => { if (dialogOpen) dispatch(fetchNextRevaluationNumber()); }, [dialogOpen, dispatch]);
  useEffect(() => { if (nextRevaluationNumber) setForm((p) => ({ ...p, revaluationNumber: nextRevaluationNumber })); }, [nextRevaluationNumber]);
  useEffect(() => { if (selectedRevaluation) setViewDialogOpen(true); }, [selectedRevaluation]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validate = () => {
    const e = {};
    if (!form.assetId) e.assetId = 'Asset required';
    if (!form.revaluationAmount || parseFloat(form.revaluationAmount) <= 0) e.revaluationAmount = 'Amount must be > 0';
    setFormErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await dispatch(createRevaluation({
      ...form, revaluationAmount: parseFloat(form.revaluationAmount),
      revaluationDate: form.revaluationDate || null, reason: form.reason || null,
    }));
    setDialogOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><RevalIcon color="secondary" sx={{ fontSize: 32 }} /><Box><Typography variant="h5" fontWeight={700}>Asset Revaluations</Typography><Typography variant="body2" color="text.secondary">Revalue assets up or down with history</Typography></Box></Box>
        <Button variant="contained" color="secondary" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Revaluation</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); dispatch(fetchRevaluations({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Reval #</TableCell><TableCell sx={{ fontWeight: 600 }}>Date</TableCell><TableCell sx={{ fontWeight: 600 }}>Asset</TableCell><TableCell sx={{ fontWeight: 600 }}>Type</TableCell><TableCell sx={{ fontWeight: 600 }}>Previous</TableCell><TableCell sx={{ fontWeight: 600 }}>Amount</TableCell><TableCell sx={{ fontWeight: 600 }}>New Value</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {revaluations.length === 0 ? (<TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No revaluations found.</Typography></TableCell></TableRow>
              ) : revaluations.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{r.revaluationNumber}</Typography></TableCell>
                  <TableCell>{r.revaluationDate}</TableCell>
                  <TableCell>{r.asset?.assetName || '-'}</TableCell>
                  <TableCell><Chip label={r.revaluationType === 'increase' ? 'Increase' : 'Decrease'} color={r.revaluationType === 'increase' ? 'success' : 'error'} size="small" /></TableCell>
                  <TableCell>{formatCurrency(r.previousValue)}</TableCell>
                  <TableCell><Typography fontWeight={600} color={r.revaluationType === 'increase' ? 'success.main' : 'error.main'}>{r.revaluationType === 'increase' ? '+' : '-'}{formatCurrency(r.revaluationAmount)}</Typography></TableCell>
                  <TableCell>{formatCurrency(r.newValue)}</TableCell>
                  <TableCell><Chip label={r.isPosted ? 'Posted' : 'Draft'} color={r.isPosted ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchRevaluation(r.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                      {!r.isPosted && <Tooltip title="Post"><IconButton size="small" color="success" onClick={() => dispatch(postRevaluation(r.id))}><PostAdd fontSize="small" /></IconButton></Tooltip>}
                      {!r.isPosted && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(r.id)}><Delete fontSize="small" /></IconButton></Tooltip>}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><RevalIcon color="secondary" /><Typography variant="h6">New Revaluation</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Revaluation #" value={form.revaluationNumber} onChange={(e) => setForm({ ...form, revaluationNumber: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Date" type="date" value={form.revaluationDate} onChange={(e) => setForm({ ...form, revaluationDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><FormControl fullWidth size="small" required error={!!formErrors.assetId}><InputLabel>Asset</InputLabel><Select value={form.assetId} label="Asset" onChange={(e) => setForm({ ...form, assetId: e.target.value })}><MenuItem value=""><em>Select</em></MenuItem>{activeAssets.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName} (BV: {formatCurrency(a.currentBookValue)})</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={form.revaluationType} label="Type" onChange={(e) => setForm({ ...form, revaluationType: e.target.value })}><MenuItem value="increase">Increase</MenuItem><MenuItem value="decrease">Decrease</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Amount" type="number" value={form.revaluationAmount} onChange={(e) => setForm({ ...form, revaluationAmount: e.target.value })} error={!!formErrors.revaluationAmount} helperText={formErrors.revaluationAmount} inputProps={{ min: 0.01, step: 0.01 }} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Reason" multiline rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" color="secondary" onClick={handleSubmit}>Create</Button></DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><RevalIcon color="secondary" /><Typography variant="h6">Revaluation Details</Typography></Box></DialogTitle>
        <DialogContent dividers>{selectedRevaluation && (
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Revaluation #</Typography><Typography variant="body1" fontWeight={600}>{selectedRevaluation.revaluationNumber}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{selectedRevaluation.revaluationDate}</Typography></Grid>
            <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedRevaluation.asset?.assetName || selectedRevaluation.assetId}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" color="text.secondary">Type</Typography><Chip label={selectedRevaluation.revaluationType === 'increase' ? 'Increase' : 'Decrease'} color={selectedRevaluation.revaluationType === 'increase' ? 'success' : 'error'} size="small" sx={{ mt: 0.5 }} /></Grid>
            <Grid item xs={4}><Typography variant="caption" color="text.secondary">Previous Value</Typography><Typography variant="body1">{formatCurrency(selectedRevaluation.previousValue)}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(selectedRevaluation.revaluationAmount)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">New Value</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(selectedRevaluation.newValue)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip label={selectedRevaluation.isPosted ? 'Posted' : 'Draft'} color={selectedRevaluation.isPosted ? 'success' : 'default'} size="small" /></Box></Grid>
            {selectedRevaluation.reason && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Reason</Typography><Typography variant="body1">{selectedRevaluation.reason}</Typography></Grid>}
          </Grid>
        )}</DialogContent>
        <DialogActions><Button onClick={() => { setViewDialogOpen(false); }}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this revaluation?</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="contained" color="error" onClick={async () => { if (deleteConfirm) { await dispatch(deleteRevaluation(deleteConfirm)); setDeleteConfirm(null); } }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetRevaluations;
