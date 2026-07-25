import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, LinearProgress,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Delete, Search, Refresh, Visibility, PostAdd, Undo,
  ShoppingCart as AcqIcon,
} from '@mui/icons-material';
import {
  fetchAcquisitions, createAcquisition, deleteAcquisition,
  postAcquisition, reverseAcquisition, fetchNextAcquisitionNumber,
  clearError, clearSelected,
} from '../store/slices/assetAcquisitionSlice';
import { fetchActiveAssetCategories } from '../store/slices/assetCategorySlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { formatCurrency } from '../utils/currency';

const ACQ_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'purchase_invoice', label: 'From Purchase Invoice' },
  { value: 'goods_receipt', label: 'From Goods Receipt' },
  { value: 'bulk', label: 'Bulk Creation' },
];

const INITIAL_LINE = { assetName: '', categoryId: '', purchaseCost: '', residualValue: '', usefulLife: 5, depreciationMethod: 'straight_line', serialNumber: '' };

const AssetAcquisitions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState({ acquisitionNumber: '', acquisitionDate: new Date().toISOString().split('T')[0], acquisitionType: 'manual', supplierId: '', description: '', notes: '' });
  const [lines, setLines] = useState([{ ...INITIAL_LINE }]);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewAcq, setViewAcq] = useState(null);

  const { acquisitions, selectedAcquisition, nextAcquisitionNumber, loading, error } = useSelector((s) => s.assetAcquisitions);
  const { activeAssetCategories } = useSelector((s) => s.assetCategories);
  const { suppliers } = useSelector((s) => s.suppliers);

  const loadData = useCallback(() => { dispatch(fetchAcquisitions({ search })); }, [dispatch, search]);

  useEffect(() => { loadData(); dispatch(fetchActiveAssetCategories()); dispatch(fetchSuppliers({ limit: 999 })); }, [loadData]);
  useEffect(() => { if (dialogOpen) dispatch(fetchNextAcquisitionNumber()); }, [dialogOpen, dispatch]);
  useEffect(() => { if (nextAcquisitionNumber) setForm((p) => ({ ...p, acquisitionNumber: nextAcquisitionNumber })); }, [nextAcquisitionNumber]);
  useEffect(() => { if (selectedAcquisition) { setViewAcq(selectedAcquisition); setViewDialogOpen(true); } }, [selectedAcquisition]);
  useEffect(() => { return () => { dispatch(clearError()); dispatch(clearSelected()); }; }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.acquisitionDate) errors.acquisitionDate = 'Date is required';
    let hasErrors = false;
    lines.forEach((line, i) => {
      if (!line.assetName.trim()) { errors[`line_${i}_name`] = 'Required'; hasErrors = true; }
      if (!line.categoryId) { errors[`line_${i}_cat`] = 'Required'; hasErrors = true; }
      if (line.purchaseCost === '' || isNaN(line.purchaseCost) || parseFloat(line.purchaseCost) < 0) { errors[`line_${i}_cost`] = 'Valid cost required'; hasErrors = true; }
    });
    if (lines.length === 0) { errors.lines = 'At least one asset line required'; hasErrors = true; }
    setFormErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      ...form,
      supplierId: form.supplierId || null,
      lines: lines.map((l) => ({
        assetName: l.assetName.trim(),
        categoryId: l.categoryId,
        purchaseCost: parseFloat(l.purchaseCost),
        residualValue: l.residualValue === '' ? 0 : parseFloat(l.residualValue),
        usefulLife: parseInt(l.usefulLife, 10) || 5,
        depreciationMethod: l.depreciationMethod || 'straight_line',
        serialNumber: l.serialNumber || null,
      })),
    };
    await dispatch(createAcquisition(data));
    setDialogOpen(false);
  };

  const handlePost = async (id) => { await dispatch(postAcquisition(id)); };
  const handleReverse = async (id) => { await dispatch(reverseAcquisition(id)); };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) { await dispatch(deleteAcquisition(deleteConfirm)); setDeleteConfirm(null); }
  };

  const addLine = () => { setLines([...lines, { ...INITIAL_LINE }]); };
  const removeLine = (idx) => { if (lines.length > 1) setLines(lines.filter((_, i) => i !== idx)); };
  const updateLine = (idx, field, value) => {
    const newLines = [...lines];
    newLines[idx][field] = value;
    setLines(newLines);
  };



  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AcqIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Asset Acquisitions</Typography>
            <Typography variant="body2" color="text.secondary">Record and post asset acquisitions</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Acquisition</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" placeholder="Search by number or description..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button></Grid>
          <Grid item xs={6} sm={3} md={2}><Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); dispatch(fetchAcquisitions({})); }}>Reset</Button></Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Acq #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total Cost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {acquisitions.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No acquisitions found.</Typography></TableCell></TableRow>
              ) : (
                acquisitions.map((acq) => (
                  <TableRow key={acq.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{acq.acquisitionNumber}</Typography></TableCell>
                    <TableCell>{acq.acquisitionDate}</TableCell>
                    <TableCell><Chip label={ACQ_TYPES.find(t => t.value === acq.acquisitionType)?.label || acq.acquisitionType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{acq.lines?.length || 0}</TableCell>
                    <TableCell>{formatCurrency(acq.totalCost)}</TableCell>
                    <TableCell><Chip label={acq.isPosted ? 'Posted' : 'Draft'} color={acq.isPosted ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View"><IconButton size="small" onClick={() => dispatch(fetchAcquisition(acq.id))}><Visibility fontSize="small" /></IconButton></Tooltip>
                        {!acq.isPosted && <Tooltip title="Post"><IconButton size="small" color="success" onClick={() => handlePost(acq.id)}><PostAdd fontSize="small" /></IconButton></Tooltip>}
                        {acq.isPosted && <Tooltip title="Reverse"><IconButton size="small" color="warning" onClick={() => handleReverse(acq.id)}><Undo fontSize="small" /></IconButton></Tooltip>}
                        {!acq.isPosted && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(acq.id)}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AcqIcon color="primary" /><Typography variant="h6">New Asset Acquisition</Typography></Box></DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Acquisition #" name="acquisitionNumber" value={form.acquisitionNumber} onChange={(e) => setForm({ ...form, acquisitionNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Date" name="acquisitionDate" type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} InputLabelProps={{ shrink: true }} error={!!formErrors.acquisitionDate} helperText={formErrors.acquisitionDate} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={form.acquisitionType} label="Type" onChange={(e) => setForm({ ...form, acquisitionType: e.target.value })}>
                  {ACQ_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select value={form.supplierId} label="Supplier" onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {suppliers?.map((s) => <MenuItem key={s.id} value={s.id}>{s.code} - {s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>

            {/* Asset Lines */}
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Asset Lines</Typography></Grid>
            {formErrors.lines && <Grid item xs={12}><Alert severity="error">{formErrors.lines}</Alert></Grid>}

            {lines.map((line, idx) => (
              <React.Fragment key={idx}>
                <Grid item xs={12} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Asset #{idx + 1}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Asset Name" value={line.assetName} onChange={(e) => updateLine(idx, 'assetName', e.target.value)} error={!!formErrors[`line_${idx}_name`]} helperText={formErrors[`line_${idx}_name`]} required />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small" required error={!!formErrors[`line_${idx}_cat`]}>
                    <InputLabel>Category</InputLabel>
                    <Select value={line.categoryId} label="Category" onChange={(e) => updateLine(idx, 'categoryId', e.target.value)}>
                      <MenuItem value=""><em>Select</em></MenuItem>
                      {activeAssetCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.categoryCode} - {c.categoryName}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Cost" type="number" value={line.purchaseCost} onChange={(e) => updateLine(idx, 'purchaseCost', e.target.value)} error={!!formErrors[`line_${idx}_cost`]} helperText={formErrors[`line_${idx}_cost`]} required inputProps={{ min: 0, step: 0.01 }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Residual Value" type="number" value={line.residualValue} onChange={(e) => updateLine(idx, 'residualValue', e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Useful Life (Yrs)" type="number" value={line.usefulLife} onChange={(e) => updateLine(idx, 'usefulLife', e.target.value)} inputProps={{ min: 1, max: 100 }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Serial #" value={line.serialNumber} onChange={(e) => updateLine(idx, 'serialNumber', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button color="error" startIcon={<Delete />} disabled={lines.length <= 1} onClick={() => removeLine(idx)}>Remove</Button>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button startIcon={<Add />} variant="outlined" size="small" onClick={addLine}>Add Another Asset</Button>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create Acquisition</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => { setViewDialogOpen(false); setViewAcq(null); }} maxWidth="md" fullWidth>
        <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AcqIcon color="primary" /><Typography variant="h6">Acquisition Details</Typography></Box></DialogTitle>
        <DialogContent dividers>
          {viewAcq && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Acquisition #</Typography><Typography variant="body1" fontWeight={600}>{viewAcq.acquisitionNumber}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Date</Typography><Typography variant="body1">{viewAcq.acquisitionDate}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body1">{ACQ_TYPES.find(t => t.value === viewAcq.acquisitionType)?.label}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Supplier</Typography><Typography variant="body1">{viewAcq.supplier?.name || '-'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Total Cost</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(viewAcq.totalCost)}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip label={viewAcq.isPosted ? 'Posted' : 'Draft'} color={viewAcq.isPosted ? 'success' : 'default'} size="small" /></Box></Grid>
                {viewAcq.description && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Description</Typography><Typography variant="body1">{viewAcq.description}</Typography></Grid>}
              </Grid>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Asset Lines</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Asset Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Useful Life</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewAcq.lines?.map((line, idx) => (
                      <TableRow key={line.id || idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{line.assetName}</TableCell>
                        <TableCell>{line.category?.categoryName || '-'}</TableCell>
                        <TableCell>{formatCurrency(line.purchaseCost)}</TableCell>
                        <TableCell>{line.usefulLife} yrs</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewDialogOpen(false); setViewAcq(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this acquisition? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetAcquisitions;
