import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, MenuItem,
  InputAdornment, Autocomplete,
} from '@mui/material';
import {
  Add, Search, Refresh, Visibility, Delete,
} from '@mui/icons-material';
import {
  fetchStockAdjustments, createStockAdjustment, updateStockAdjustment, deleteStockAdjustment,
  approveStockAdjustment, clearError,
} from '../store/slices/stockAdjustmentSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchItems } from '../store/slices/itemSlice';

const INITIAL_FORM = {
  warehouseId: '',
  adjustmentDate: new Date().toISOString().split('T')[0],
  reason: '',
  notes: '',
  details: [],
};

const REASONS = [
  { value: 'physical_count', label: 'Physical Count' },
  { value: 'damage', label: 'Damage' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'theft', label: 'Theft' },
  { value: 'correction', label: 'Correction' },
  { value: 'initial_stock', label: 'Initial Stock' },
];

const STATUS_COLORS = {
  Draft: 'default',
  Approved: 'success',
  Cancelled: 'error',
};

const StockAdjustments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const {
    stockAdjustments, loading, error,
  } = useSelector((state) => state.stockAdjustments);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { items } = useSelector((state) => state.items);

  const isEditing = !!id && !location.pathname.includes('/new');
  const isNew = location.pathname.includes('/new');

  const loadData = useCallback(() => {
    dispatch(fetchStockAdjustments({ search }));
    dispatch(fetchWarehouses({}));
    dispatch(fetchItems({}));
  }, [dispatch, search]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (isEditing && id) {
      const adj = stockAdjustments.find((a) => String(a.id) === String(id));
      if (adj) {
        setForm({
          warehouseId: adj.warehouse?.id || adj.warehouseId || '',
          adjustmentDate: adj.adjustmentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          reason: adj.reason || '',
          notes: adj.notes || '',
          details: adj.details || [],
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, stockAdjustments]);

  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.warehouseId) errors.warehouseId = 'Warehouse is required';
    if (!form.reason) errors.reason = 'Reason is required';
    if (!form.adjustmentDate) errors.adjustmentDate = 'Date is required';
    if (form.details.length === 0) errors.details = 'At least one item is required';
    form.details.forEach((d, i) => {
      if (!d.itemId) errors[`item_${i}`] = 'Item is required';
      if (d.adjustedQuantity === '' || d.adjustedQuantity === undefined) errors[`qty_${i}`] = 'Quantity required';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    let result;
    if (isEditing && id) {
      result = await dispatch(updateStockAdjustment({ id, data: form }));
    } else {
      result = await dispatch(createStockAdjustment(form));
    }
    // Only close if the request succeeded - prevents silent data loss
    if (result.meta.requestStatus === 'fulfilled') {
      handleClose();
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
    dispatch(clearError());
    if (isEditing || isNew) navigate('/app/inventory/adjustments');
  };

  const handleDelete = async (adjId) => {
    await dispatch(deleteStockAdjustment(adjId));
    setDeleteConfirm(null);
    loadData();
  };

  const handleApprove = async (adjId) => {
    await dispatch(approveStockAdjustment(adjId));
    loadData();
  };

  const addDetailRow = () => {
    setForm({
      ...form,
      details: [...form.details, { itemId: '', currentQuantity: 0, adjustedQuantity: '', unitCost: 0 }],
    });
  };

  const removeDetailRow = (index) => {
    setForm({
      ...form,
      details: form.details.filter((_, i) => i !== index),
    });
  };

  const updateDetail = (index, field, value) => {
    const updated = [...form.details];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, details: updated });
  };

  const handleItemSelect = (index, item) => {
    if (item) {
      setForm((prev) => {
        const updated = [...prev.details];
        updated[index] = { ...updated[index], itemId: item.id, unitCost: item.costPrice || 0 };
        return { ...prev, details: updated };
      });
    }
  };

  // Filter only Product type items
  const productItems = Array.isArray(items) ? items.filter((i) => i.itemType === 'product') : [];

  const filtered = stockAdjustments.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.adjustmentNumber?.toLowerCase().includes(s) ||
      a.reason?.toLowerCase().includes(s)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Stock Adjustments</Typography>
          <Typography variant="body2" color="text.secondary">Adjust inventory for physical count, damage, expiry, etc.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/inventory/adjustments/new')}>
          New Adjustment
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" placeholder="Search adjustments..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={8} sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={loadData} size="small">Refresh</Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Number</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Warehouse</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No stock adjustments found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((adj) => (
                  <TableRow key={adj.id} hover>
                    <TableCell>{adj.adjustmentNumber}</TableCell>
                    <TableCell>{adj.adjustmentDate?.split('T')[0]}</TableCell>
                    <TableCell>{adj.warehouse?.name || '-'}</TableCell>
                    <TableCell>{adj.reason}</TableCell>
                    <TableCell>{adj.StockAdjustmentDetails?.length || adj.details?.length || 0}</TableCell>
                    <TableCell>
                      <Chip label={adj.status} color={STATUS_COLORS[adj.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/app/inventory/adjustments/${adj.id}/edit`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {adj.status === 'Draft' && (
                        <Tooltip title="Approve">
                          <IconButton size="small" color="success" onClick={() => handleApprove(adj.id)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(adj.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'View Adjustment' : 'New Stock Adjustment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Warehouse" value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                error={!!formErrors.warehouseId} helperText={formErrors.warehouseId} required
                disabled={isEditing}
              >
                {Array.isArray(warehouses) && warehouses.filter(w => w.isActive).map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Date" type="date" value={form.adjustmentDate}
                onChange={(e) => setForm({ ...form, adjustmentDate: e.target.value })}
                error={!!formErrors.adjustmentDate} helperText={formErrors.adjustmentDate}
                disabled={isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Reason" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                error={!!formErrors.reason} helperText={formErrors.reason}
                disabled={isEditing}
              >
                {REASONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={form.notes} multiline rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={isEditing}
              />
            </Grid>

            {/* Detail Rows */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Items</Typography>
                {!isEditing && (
                  <Button size="small" startIcon={<Add />} onClick={addDetailRow}>Add Item</Button>
                )}
              </Box>
              {formErrors.details && <Typography color="error" variant="caption">{formErrors.details}</Typography>}
              {form.details.map((detail, index) => (
                <Paper key={index} sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Autocomplete
                        size="small"
                        options={productItems}
                        getOptionLabel={(opt) => `${opt.itemCode} - ${opt.name}`}
                        value={productItems.find((i) => i.id === detail.itemId) || null}
                        onChange={(_, v) => handleItemSelect(index, v)}
                        disabled={isEditing}
                        renderInput={(params) => (
                          <TextField {...params} label="Item" error={!!formErrors[`item_${index}`]}
                            helperText={formErrors[`item_${index}`]}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField size="small" fullWidth label="Current Qty" type="number"
                        value={detail.currentQuantity} disabled
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField size="small" fullWidth label="New Qty" type="number"
                        value={detail.adjustedQuantity}
                        onChange={(e) => updateDetail(index, 'adjustedQuantity', parseFloat(e.target.value) || '')}
                        error={!!formErrors[`qty_${index}`]} helperText={formErrors[`qty_${index}`]}
                        disabled={isEditing}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField size="small" fullWidth label="Unit Cost" type="number"
                        value={detail.unitCost}
                        onChange={(e) => updateDetail(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        disabled={isEditing}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      {!isEditing && (
                        <IconButton size="small" color="error" onClick={() => removeDetailRow(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {!isEditing && (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>Create</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Adjustment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this stock adjustment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockAdjustments;