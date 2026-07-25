import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Grid, LinearProgress, InputAdornment, MenuItem, Select, FormControl, InputLabel, Stepper, Step, StepLabel } from '@mui/material';
import { Add, Delete, Search, Refresh, Visibility, Undo, TrendingDown as DeprIcon, Preview, PostAdd } from '@mui/icons-material';
import { fetchDepreciations, fetchDepreciation, postDepreciation, reverseDepreciation, deleteDepreciation, previewDepreciation, fetchNextDepreciationNumber, clearError, clearSelected } from '../store/slices/assetDepreciationSlice';
import { fetchAssets } from '../store/slices/assetSlice';
import { formatCurrency } from '../utils/currency';

const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' },
];

const AssetDepreciations = () => {
  const dispatch = useDispatch(); const [search, setSearch] = useState(''); const [assetFilter, setAssetFilter] = useState('');
  const [postDialogOpen, setPostDialogOpen] = useState(false); const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(''); const [frequency, setFrequency] = useState('monthly');
  const [depreciationDate, setDepreciationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(''); const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { depreciations, selectedDepreciation, previewResult, loading, error } = useSelector((s) => s.depreciations);
  const { assets } = useSelector((s) => s.assets);
  const activeAssets = assets?.filter((a) => a.status === 'active' && parseFloat(a.currentBookValue) > 0) || [];

  const loadData = useCallback(() => {
    const params = { search };
    if (assetFilter) params.assetId = assetFilter;
    dispatch(fetchDepreciations(params));
  }, [dispatch, search, assetFilter]);

  useEffect(() => { loadData(); dispatch(fetchAssets({ limit: 999 })); }, [loadData]);
  useEffect(() => { if (selectedDepreciation) { setViewDialogOpen(true); } }, [selectedDepreciation]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const handlePreview = () => {
    if (!selectedAssetId) return;
    dispatch(previewDepreciation({ assetId: selectedAssetId, frequency }));
  };

  const handlePost = async () => {
    if (!selectedAssetId) return;
    await dispatch(postDepreciation({ assetId: selectedAssetId, depreciationDate, frequency, notes: notes || null }));
    setPostDialogOpen(false); setSelectedAssetId(''); setPreviewResult(null); setNotes('');
  };

  const handleReverse = async (id) => { await dispatch(reverseDepreciation(id)); };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeprIcon color="primary" sx={{ fontSize: 32 }} />
          <Box><Typography variant="h5" fontWeight={700}>Asset Depreciation</Typography><Typography variant="body2" color="text.secondary">Calculate, preview, and post asset depreciation</Typography></Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setPostDialogOpen(true); dispatch(fetchNextDepreciationNumber()); }}>Post Depreciation</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid>
          <Grid item xs={6} sm={3} md={2}><FormControl fullWidth size="small"><InputLabel>Asset</InputLabel><Select value={assetFilter} label="Asset" onChange={(e) => setAssetFilter(e.target.value)}><MenuItem value="">All</MenuItem>{activeAssets.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setAssetFilter(''); dispatch(fetchDepreciations({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Depr #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Accum. Depr.</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {depreciations.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No depreciation records found.</Typography></TableCell></TableRow>
              ) : depreciations.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{d.depreciationNumber}</Typography></TableCell>
                  <TableCell>{d.depreciationDate}</TableCell>
                  <TableCell>{d.asset?.assetName || d.asset?.assetCode || '-'}</TableCell>
                  <TableCell><Chip label={d.frequency} size="small" variant="outlined" /></TableCell>
                  <TableCell><Typography fontWeight={600} color="error.main">{formatCurrency(d.depreciationAmount)}</Typography></TableCell>
                  <TableCell>{formatCurrency(d.accumulatedDepreciationAfter)}</TableCell>
                  <TableCell><Chip label={d.isPosted ? 'Posted' : 'Draft'} color={d.isPosted ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchDepreciation(d.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                      {d.isPosted && <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={() => handleReverse(d.id)}><Undo fontSize="small" /></IconButton></Tooltip>}
                      {!d.isPosted && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(d.id)}><Delete fontSize="small" /></IconButton></Tooltip>}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Post Depreciation Dialog */}
      <Dialog open={postDialogOpen} onClose={() => { setPostDialogOpen(false); setSelectedAssetId(''); setPreviewResult(null); }} maxWidth="md" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DeprIcon color="primary" /><Typography variant="h6">Post Depreciation</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Asset</InputLabel>
                <Select value={selectedAssetId} label="Asset" onChange={(e) => { setSelectedAssetId(e.target.value); setPreviewResult(null); }}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {activeAssets.map((a) => <MenuItem key={a.id} value={a.id}>{a.assetCode} - {a.assetName} ({formatCurrency(a.currentBookValue)})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Frequency</InputLabel>
                <Select value={frequency} label="Frequency" onChange={(e) => { setFrequency(e.target.value); setPreviewResult(null); }}>
                  {FREQ_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Date" type="date" value={depreciationDate} onChange={(e) => setDepreciationDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<Preview />} onClick={handlePreview} disabled={!selectedAssetId} fullWidth>
                Preview Depreciation
              </Button>
            </Grid>

            {loading && <Grid item xs={12}><LinearProgress /></Grid>}

            {previewResult && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Depreciation Preview</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body2">{previewResult.assetName} ({previewResult.assetCode})</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Cost</Typography><Typography variant="body2">{formatCurrency(previewResult.assetCost)}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Book Value</Typography><Typography variant="body2">{formatCurrency(previewResult.currentBookValue)}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Monthly</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(previewResult.monthlyAmount)}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Quarterly</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(previewResult.quarterlyAmount)}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Yearly</Typography><Typography variant="body2" fontWeight={600}>{formatCurrency(previewResult.yearlyAmount)}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="caption" color="text.secondary">Remaining Life</Typography><Typography variant="body2">{previewResult.remainingLifeMonths} months</Typography></Grid>
                  </Grid>

                  {previewResult.schedule?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Schedule</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Accumulated</TableCell>
                              <TableCell>Book Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {previewResult.schedule.map((s, i) => (
                              <TableRow key={i}>
                                <TableCell>{s.periodLabel}</TableCell>
                                <TableCell>{formatCurrency(s.depreciationAmount)}</TableCell>
                                <TableCell>{formatCurrency(s.accumulatedDepreciation)}</TableCell>
                                <TableCell>{formatCurrency(s.bookValue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPostDialogOpen(false); setSelectedAssetId(''); setPreviewResult(null); }}>Cancel</Button>
          <Button variant="contained" startIcon={<PostAdd />} onClick={handlePost} disabled={!selectedAssetId}>Post Depreciation</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DeprIcon color="primary" /><Typography variant="h6">Depreciation Details</Typography></Box></DialogTitle>
        <DialogContent dividers>
          {selectedDepreciation && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Depreciation #</Typography><Typography variant="body1" fontWeight={600}>{selectedDepreciation.depreciationNumber}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{selectedDepreciation.depreciationDate}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Asset</Typography><Typography variant="body1">{selectedDepreciation.asset?.assetName || selectedDepreciation.assetId}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Method</Typography><Typography variant="body1">{selectedDepreciation.depreciationMethod}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Frequency</Typography><Typography variant="body1">{selectedDepreciation.frequency}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body1" fontWeight={600} color="error.main">{formatCurrency(selectedDepreciation.depreciationAmount)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Accum. Before</Typography><Typography variant="body1">{formatCurrency(selectedDepreciation.accumulatedDepreciationBefore)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Accum. After</Typography><Typography variant="body1">{formatCurrency(selectedDepreciation.accumulatedDepreciationAfter)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Book Value After</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(selectedDepreciation.bookValueAfter)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip label={selectedDepreciation.isPosted ? 'Posted' : 'Draft'} color={selectedDepreciation.isPosted ? 'success' : 'default'} size="small" /></Box></Grid>
              {selectedDepreciation.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body1">{selectedDepreciation.notes}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewDialogOpen(false); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this depreciation record?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => { if (deleteConfirm) { await dispatch(deleteDepreciation(deleteConfirm)); setDeleteConfirm(null); } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetDepreciations;
