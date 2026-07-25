import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Add, Search, Refresh, Visibility, Delete, SwapHoriz,
} from '@mui/icons-material';
import {
  fetchStockTransfers, fetchStockTransfer, createStockTransfer, updateStockTransfer, deleteStockTransfer,
  approveStockTransfer, completeStockTransfer, cancelStockTransfer, clearError,
} from '../store/slices/stockTransferSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';
import { fetchItems } from '../store/slices/itemSlice';

const INITIAL_FORM = {
  fromWarehouseId: '',
  toWarehouseId: '',
  transferDate: new Date().toISOString().split('T')[0],
  notes: '',
  details: [],
};

const STATUS_COLORS = {
  Draft: 'default',
  Approved: 'info',
  Completed: 'success',
  Cancelled: 'error',
};

const StockTransfers = () => {
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
    stockTransfers, selectedItem, loading, error,
  } = useSelector((state) => state.stockTransfers);
  const { warehouses } = useSelector((state) => state.warehouses);
  const { items } = useSelector((state) => state.items);

  const isEditing = !!id && !location.pathname.includes('/new');
  const isNew = location.pathname.includes('/new');

  const loadData = useCallback(() => {
    dispatch(fetchStockTransfers({ search }));
    dispatch(fetchWarehouses({}));
    // Fetch items with high limit; filter for inventory-tracked products in the dropdown
    dispatch(fetchItems({ limit: 1000 }));
  }, [dispatch, search]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchStockTransfer(id));
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, dispatch]);

  // Populate form when selectedItem loads in edit mode
  useEffect(() => {
    if (isEditing && selectedItem && selectedItem.id === id) {
      setForm({
        fromWarehouseId: selectedItem.fromWarehouseId || '',
        toWarehouseId: selectedItem.toWarehouseId || '',
        transferDate: selectedItem.transferDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: selectedItem.notes || '',
        details: selectedItem.details || [],
      });
      setDialogOpen(true);
    }
  }, [isEditing, selectedItem, id]);

  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.fromWarehouseId) errors.fromWarehouseId = 'Source warehouse is required';
    if (!form.toWarehouseId) errors.toWarehouseId = 'Destination warehouse is required';
    if (form.fromWarehouseId && form.toWarehouseId && form.fromWarehouseId === form.toWarehouseId) {
      errors.fromWarehouseId = 'Source and destination cannot be the same';
      errors.toWarehouseId = 'Source and destination cannot be the same';
    }
    if (form.details.length === 0) errors.details = 'At least one item is required';
    form.details.forEach((d, i) => {
      if (!d.itemId) errors[`item_${i}`] = 'Item is required';
      if (!d.quantity || d.quantity <= 0) errors[`qty_${i}`] = 'Quantity must be greater than 0';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isEditing && id) {
      await dispatch(updateStockTransfer({ id, data: form }));
    } else {
      await dispatch(createStockTransfer(form));
    }
    handleClose();
  };

  const handleClose = () => {
    setDialogOpen(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
    dispatch(clearError());
    if (isEditing || isNew) navigate('/app/inventory/transfers');
  };

  const handleDelete = async (tId) => {
    await dispatch(deleteStockTransfer(tId));
    setDeleteConfirm(null);
    loadData();
  };

  const handleApprove = async (tId) => {
    await dispatch(approveStockTransfer(tId));
    loadData();
  };

  const handleComplete = async (tId) => {
    await dispatch(completeStockTransfer(tId));
    loadData();
  };

  const handleCancel = async (tId) => {
    await dispatch(cancelStockTransfer(tId));
    loadData();
  };

  const addDetailRow = () => {
    setForm({
      ...form,
      details: [...form.details, { itemId: '', quantity: '', unitCost: 0 }],
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

  // Build list of product items for the Autocomplete dropdown.
  // Includes: active inventory-tracked products PLUS any items already in the
  // form details (so items in existing transfers always resolve correctly).
  const productItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    // Base: product items
    const base = items.filter(
      (i) => i.itemType === 'product' && i.isActive,
    );

    // Also include items referenced by form details that may not be in base
    // (e.g. items in an existing transfer that were deactivated)
    const detailItemIds = form.details.map((d) => d.itemId).filter(Boolean);
    const extra = items.filter(
      (i) => detailItemIds.includes(i.id) && !base.some((b) => b.id === i.id),
    );

    return [...base, ...extra];
  }, [items, form.details]);

  const filtered = stockTransfers.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.transferNumber?.toLowerCase().includes(s);
  });

  const getWarehouseName = (wId) => {
    const w = warehouses.find((wh) => wh.id === wId);
    return w ? w.name : '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Stock Transfers</Typography>
          <Typography variant="body2" color="text.secondary">Transfer stock between warehouses</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/inventory/transfers/new')}>
          New Transfer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" placeholder="Search transfers..."
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
                <TableCell><strong>From</strong></TableCell>
                <TableCell><strong>To</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No stock transfers found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>{transfer.transferNumber}</TableCell>
                    <TableCell>{transfer.transferDate?.split('T')[0]}</TableCell>
                    <TableCell>{transfer.fromWarehouse?.name || getWarehouseName(transfer.fromWarehouseId) || '-'}</TableCell>
                    <TableCell>{transfer.toWarehouse?.name || getWarehouseName(transfer.toWarehouseId) || '-'}</TableCell>
                    <TableCell>{transfer.StockTransferDetails?.length || transfer.details?.length || 0}</TableCell>
                    <TableCell>
                      <Chip label={transfer.status} color={STATUS_COLORS[transfer.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/app/inventory/transfers/${transfer.id}/edit`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {transfer.status === 'Draft' && (
                        <Tooltip title="Approve">
                          <IconButton size="small" color="primary" onClick={() => handleApprove(transfer.id)}>
                            <SwapHoriz fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {transfer.status === 'Approved' && (
                        <Tooltip title="Complete">
                          <IconButton size="small" color="success" onClick={() => handleComplete(transfer.id)}>
                            <SwapHoriz fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(transfer.status === 'Draft') && (
                        <>
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="warning" onClick={() => handleCancel(transfer.id)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteConfirm(transfer.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
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
        <DialogTitle>{isEditing ? 'View Transfer' : 'New Stock Transfer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="From Warehouse" value={form.fromWarehouseId}
                onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
                error={!!formErrors.fromWarehouseId} helperText={formErrors.fromWarehouseId} required
                disabled={isEditing}
              >
                {Array.isArray(warehouses) && warehouses.filter(w => w.isActive).map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="To Warehouse" value={form.toWarehouseId}
                onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
                error={!!formErrors.toWarehouseId} helperText={formErrors.toWarehouseId} required
                disabled={isEditing}
              >
                {Array.isArray(warehouses) && warehouses.filter(w => w.isActive).map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date" type="date" value={form.transferDate}
                onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
                disabled={isEditing} InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={form.notes} multiline rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">Items</Typography>
                  {loading && productItems.length === 0 && (
                    <CircularProgress size={14} />
                  )}
                </Box>
                {!isEditing && (
                  <Button size="small" startIcon={<Add />} onClick={addDetailRow}>Add Item</Button>
                )}
              </Box>
              {formErrors.details && <Typography color="error" variant="caption">{formErrors.details}</Typography>}
              {form.details.map((detail, index) => (
                <Paper key={index} sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <Autocomplete
                        size="small"
                        options={productItems}
                        getOptionLabel={(opt) => `${opt.itemCode} - ${opt.name}`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={productItems.find((i) => i.id === detail.itemId) || null}
                        onChange={(_, v) => handleItemSelect(index, v)}
                        disabled={isEditing}
                        filterOptions={(options, { inputValue }) => {
                          if (!inputValue) return options;
                          const lower = inputValue.toLowerCase();
                          return options.filter(
                            (opt) =>
                              opt.itemCode?.toLowerCase().includes(lower) ||
                              opt.name?.toLowerCase().includes(lower)
                          );
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Item" error={!!formErrors[`item_${index}`]}
                            helperText={formErrors[`item_${index}`]}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField size="small" fullWidth label="Quantity" type="number"
                        value={detail.quantity}
                        onChange={(e) => updateDetail(index, 'quantity', parseFloat(e.target.value) || '')}
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
        <DialogTitle>Delete Transfer</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this stock transfer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockTransfers;