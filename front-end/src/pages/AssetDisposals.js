import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, Undo, PostAdd, DeleteForever as DisposeIcon } from '@mui/icons-material';
import { fetchDisposals, fetchDisposal, createDisposal, postDisposal, reverseDisposal, deleteDisposal, fetchNextDisposalNumber, clearError, clearSelected } from '../store/slices/assetDisposalSlice';
import { fetchAssets } from '../store/slices/assetSlice';
import { formatCurrency } from '../utils/currency';

const DISPOSAL_TYPES = [
  { value: 'sale', label: 'Sale', color: 'info' },
  { value: 'scrap', label: 'Scrap', color: 'warning' },
  { value: 'donation', label: 'Donation', color: 'success' },
  { value: 'write_off', label: 'Write-Off', color: 'error' },
  { value: 'lost', label: 'Lost', color: 'error' },
];

const AssetDisposals = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState(''); const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false); const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState({ disposalNumber: '', assetId: '', disposalDate: new Date().toISOString().split('T')[0], disposalType: 'sale', saleAmount: '', reference: '', notes: '' });
  const [formErrors, setFormErrors] = useState({}); const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { disposals, selectedDisposal, nextDisposalNumber, loading, error } = useSelector((s) => s.disposals);
  const { assets } = useSelector((s) => s.assets);
  const activeAssets = assets?.filter((a) => a.status === 'active') || [];

  const loadData = useCallback(() => { const p = { search }; if (typeFilter) p.disposalType = typeFilter; dispatch(fetchDisposals(p)); }, [dispatch, search, typeFilter]);
  useEffect(() => { loadData(); dispatch(fetchAssets({ limit: 999 })); }, [loadData]);
  useEffect(() => { if (dialogOpen) dispatch(fetchNextDisposalNumber()); }, [dialogOpen, dispatch]);
  useEffect(() => { if (nextDisposalNumber) setForm((p) => ({ ...p, disposalNumber: nextDisposalNumber })); }, [nextDisposalNumber]);
  useEffect(() => { if (selectedDisposal) setViewDialogOpen(true); }, [selectedDisposal]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validate = () => {
    const e = {};
    if (!form.assetId) e.assetId = 'Asset required';
    if (!form.disposalType) e.disposalType = 'Type required';
    setFormErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await dispatch(createDisposal({
      ...form, saleAmount: form.saleAmount === '' ? 0 : parseFloat(form.saleAmount),
      disposalDate: form.disposalDate || null, reference: form.reference || null, notes: form.notes || null,
    }));
    setDialogOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DisposeIcon color="error" sx={{ fontSize: 32 }} />
          <Box><Typography variant="h5" fontWeight={700}>Asset Disposals</Typography><Typography variant="body2" color="text.secondary">Manage asset disposals (sale, scrap, donation, write-off, lost)</Typography></Box>
        </Box>
        <Button variant="contained" color="error" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Disposal</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}><MenuItem value="">All</MenuItem>{DISPOSAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setTypeFilter(''); dispatch(fetchDisposals({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Disposal #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>NBV</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Gain/Loss</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disposals.length === 0 ? (<TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No disposals found.</Typography></TableCell></TableRow>
              ) : disposals.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{d.disposalNumber}</Typography></TableCell>
                  <TableCell>{d.disposalDate}</TableCell>
                  <TableCell>{d.asset?.assetName || '-'}</TableCell>
                  <TableCell><Chip label={DISPOSAL_TYPES.find((t) => t.value === d.disposalType)?.label || d.disposalType} color={DISPOSAL_TYPES.find((t) => t.value === d.disposalType)?.color || 'default'} size="small" /></TableCell>
                  <TableCell>{formatCurrency(d.netBookValue)}</TableCell>
                  <TableCell>
                    {d.gainOnDisposal > 0 ? <Typography color="success.main" fontWeight={600}>Gain: {formatCurrency(d.gainOnDisposal)}</Typography> : d.lossOnDisposal > 0 ? <Typography color="error.main" fontWeight={600}>Loss: {formatCurrency(d.lossOnDisposal)}</Typography> : '-'}
                  </TableCell>
                  <TableCell><Chip label={d.isPosted ? 'Posted' : 'Draft'} color={d.isPosted ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchDisposal(d.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                      {!d.isPosted && <Tooltip title="Post"><IconButton size="small" color="success" onClick={() => dispatch(postDisposal(d.id))}><PostAdd fontSize="small" /></IconButton></Tooltip>}
                      {d.isPosted && <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={() => dispatch(reverseDisposal(d.id))}><Undo fontSize="small" /></IconButton></Tooltip>}
                      {!d.isPosted && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(d.id)}><Delete fontSize="small" /></IconButton></Tooltip>}
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
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DisposeIcon color="error" /><Typography variant="h6">New Asset Disposal</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Disposal #" value={form.disposalNumber} onChange={(e) => setForm({ ...form, disposalNumber: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Date" type="date" value={form.disposalDate} onChange={(e) => setForm({ ...form, disposalDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required error={!!formErrors.assetId}>
                <InputLabel>Asset</InputLabel>
                <Select value={form.assetId} label="Asset" onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {activeAssets.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName} (BV: {formatCurrency(a.currentBookValue)})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required error={!!formErrors.disposalType}>
                <InputLabel>Disposal Type</InputLabel>
                <Select value={form.disposalType} label="Disposal Type" onChange={(e) => setForm({ ...form, disposalType: e.target.value })}>
                  {DISPOSAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {form.disposalType === 'sale' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Sale Amount" type="number" value={form.saleAmount} onChange={(e) => setForm({ ...form, saleAmount: e.target.value })} inputProps={{ min: 0, step: 0.01 }} />
              </Grid>
            )}
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSubmit}>Create Disposal</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DisposeIcon color="error" /><Typography variant="h6">Disposal Details</Typography></Box></DialogTitle>
        <DialogContent dividers>
          {selectedDisposal && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Disposal #</Typography><Typography variant="body1" fontWeight={600}>{selectedDisposal.disposalNumber}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{selectedDisposal.disposalDate}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedDisposal.asset?.assetName || selectedDisposal.assetId}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Type</Typography><Chip label={DISPOSAL_TYPES.find((t) => t.value === selectedDisposal.disposalType)?.label || selectedDisposal.disposalType} color={DISPOSAL_TYPES.find((t) => t.value === selectedDisposal.disposalType)?.color || 'default'} size="small" sx={{ mt: 0.5 }} /></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip label={selectedDisposal.isPosted ? 'Posted' : 'Draft'} color={selectedDisposal.isPosted ? 'success' : 'default'} size="small" /></Box></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Net Book Value</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(selectedDisposal.netBookValue)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Sale Amount</Typography><Typography variant="body1">{formatCurrency(selectedDisposal.saleAmount)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Accumulated Depreciation</Typography><Typography variant="body1">{formatCurrency(selectedDisposal.accumulatedDepreciation)}</Typography></Grid>
              <Grid item xs={6}>
                {selectedDisposal.gainOnDisposal > 0 ? (
                  <><Typography variant="caption" color="success.main" fontWeight={600}>Gain on Disposal</Typography><Typography variant="body1" fontWeight={600} color="success.main">{formatCurrency(selectedDisposal.gainOnDisposal)}</Typography></>
                ) : selectedDisposal.lossOnDisposal > 0 ? (
                  <><Typography variant="caption" color="error.main" fontWeight={600}>Loss on Disposal</Typography><Typography variant="body1" fontWeight={600} color="error.main">{formatCurrency(selectedDisposal.lossOnDisposal)}</Typography></>
                ) : <><Typography variant="caption" color="text.secondary">Gain/Loss</Typography><Typography variant="body1">-</Typography></>}
              </Grid>
              {selectedDisposal.reference && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Reference</Typography><Typography variant="body1">{selectedDisposal.reference}</Typography></Grid>}
              {selectedDisposal.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body1">{selectedDisposal.notes}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => { setViewDialogOpen(false); }}>Close</Button></DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this disposal record?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => { if (deleteConfirm) { await dispatch(deleteDisposal(deleteConfirm)); setDeleteConfirm(null); } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetDisposals;
