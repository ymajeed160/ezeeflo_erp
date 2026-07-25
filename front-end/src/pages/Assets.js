import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, Switch, FormControlLabel,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh,
  ArrowBack, PrecisionManufacturing as AssetIcon, CheckCircle, Block,
} from '@mui/icons-material';
import {
  fetchAssets, createAsset, updateAsset, deleteAsset,
  updateAssetStatus, fetchNextAssetCode, clearError, clearSelected,
} from '../store/slices/assetSlice';
import { fetchActiveAssetCategories } from '../store/slices/assetCategorySlice';
import { fetchSuppliers } from '../store/slices/supplierSlice';
import { formatCurrency } from '../utils/currency';

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'disposed', label: 'Disposed', color: 'error' },
  { value: 'sold', label: 'Sold', color: 'warning' },
  { value: 'transferred', label: 'Transferred', color: 'info' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'warning' },
  { value: 'retired', label: 'Retired', color: 'error' },
  { value: 'lost', label: 'Lost', color: 'error' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'obsolete', label: 'Obsolete' },
];

const DEPRECIATION_METHODS = [
  { value: 'straight_line', label: 'Straight Line' },
  { value: 'declining_balance', label: 'Declining Balance' },
  { value: 'double_declining_balance', label: 'Double Declining Balance' },
  { value: 'units_of_production', label: 'Units of Production' },
  { value: 'manual', label: 'Manual' },
];

const INITIAL_FORM = {
  assetCode: '',
  assetName: '',
  categoryId: '',
  serialNumber: '',
  barcode: '',
  manufacturer: '',
  model: '',
  purchaseDate: '',
  capitalizationDate: '',
  supplierId: '',
  purchaseInvoiceId: '',
  purchaseCost: '',
  residualValue: '',
  usefulLife: 5,
  depreciationMethod: 'straight_line',
  location: '',
  department: '',
  custodian: '',
  warrantyExpiry: '',
  condition: 'new',
  status: 'draft',
  notes: '',
};

const Assets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState({ assetId: null, currentStatus: '', newStatus: '' });
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);

  const {
    assets, selectedAsset, nextAssetCode, loading, error,
  } = useSelector((state) => state.assets);

  const { activeAssetCategories } = useSelector((state) => state.assetCategories);
  const { suppliers } = useSelector((state) => state.suppliers);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    const params = { search };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchAssets(params));
  }, [dispatch, search, statusFilter]);

  const loadDependencies = useCallback(() => {
    dispatch(fetchActiveAssetCategories());
    dispatch(fetchSuppliers({ limit: 999 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
    loadDependencies();
  }, [loadData, loadDependencies]);

  useEffect(() => {
    if (isNew) {
      dispatch(fetchNextAssetCode());
    }
  }, [isNew, dispatch]);

  useEffect(() => {
    if (isNew && nextAssetCode) {
      setForm((prev) => ({ ...prev, assetCode: nextAssetCode }));
    }
  }, [isNew, nextAssetCode]);

  useEffect(() => {
    if (isEditing && id) {
      const asset = assets.find((a) => a.id === id);
      if (asset) {
        setForm({
          assetCode: asset.assetCode || '',
          assetName: asset.assetName || '',
          categoryId: asset.categoryId || '',
          serialNumber: asset.serialNumber || '',
          barcode: asset.barcode || '',
          manufacturer: asset.manufacturer || '',
          model: asset.model || '',
          purchaseDate: asset.purchaseDate || '',
          capitalizationDate: asset.capitalizationDate || '',
          supplierId: asset.supplierId || '',
          purchaseInvoiceId: asset.purchaseInvoiceId || '',
          purchaseCost: asset.purchaseCost ?? '',
          residualValue: asset.residualValue ?? '',
          usefulLife: asset.usefulLife || 5,
          depreciationMethod: asset.depreciationMethod || 'straight_line',
          location: asset.location || '',
          department: asset.department || '',
          custodian: asset.custodian || '',
          warrantyExpiry: asset.warrantyExpiry || '',
          condition: asset.condition || 'new',
          status: asset.status || 'draft',
          notes: asset.notes || '',
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, assets]);

  useEffect(() => {
    if (isView && id && selectedAsset) {
      setViewAsset(selectedAsset);
      setViewDialogOpen(true);
    } else if (isView && id && !selectedAsset) {
      dispatch(fetchAssets({ search }));
    }
  }, [isView, id, selectedAsset, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.assetName.trim()) errors.assetName = 'Asset name is required';
    if (!form.categoryId) errors.categoryId = 'Category is required';
    if (form.purchaseCost === '' || form.purchaseCost === null) {
      errors.purchaseCost = 'Purchase cost is required';
    } else if (isNaN(form.purchaseCost) || parseFloat(form.purchaseCost) < 0) {
      errors.purchaseCost = 'Must be a non-negative number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data = {
      ...form,
      purchaseCost: form.purchaseCost === '' ? 0 : parseFloat(form.purchaseCost),
      residualValue: form.residualValue === '' ? 0 : parseFloat(form.residualValue),
      usefulLife: parseInt(form.usefulLife, 10),
      purchaseDate: form.purchaseDate || null,
      capitalizationDate: form.capitalizationDate || null,
      warrantyExpiry: form.warrantyExpiry || null,
      purchaseInvoiceId: form.purchaseInvoiceId || null,
      supplierId: form.supplierId || null,
    };
    delete data.purchaseInvoiceId;

    if (isEditing && id) {
      await dispatch(updateAsset({ id, data }));
    } else {
      await dispatch(createAsset(data));
    }

    setDialogOpen(false);
    navigate('/app/fixed-assets/register');
  };

  const handleStatusChange = async () => {
    if (statusAction.assetId) {
      await dispatch(updateAssetStatus({ id: statusAction.assetId, status: statusAction.newStatus }));
      setStatusDialogOpen(false);
      setStatusAction({ assetId: null, currentStatus: '', newStatus: '' });
    }
  };

  const openStatusDialog = (asset) => {
    const transitionMap = {
      draft: ['active'],
      active: ['disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'],
      under_maintenance: ['active', 'disposed', 'retired'],
      transferred: ['active'],
    };
    const allowed = transitionMap[asset.status] || [];
    if (allowed.length > 0) {
      setStatusAction({ assetId: asset.id, currentStatus: asset.status, newStatus: allowed[0] });
      setStatusDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await dispatch(deleteAsset(deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const handleView = (asset) => {
    setViewAsset(asset);
    setViewDialogOpen(true);
  };

  const handleEdit = (assetId) => {
    navigate(`/app/fixed-assets/register/${assetId}/edit`);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
    navigate('/app/fixed-assets/register');
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewAsset(null);
    navigate('/app/fixed-assets/register');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const getStatusChip = (status) => {
    const s = STATUSES.find((st) => st.value === status);
    return <Chip label={s ? s.label : status} color={s ? s.color : 'default'} size="small" />;
  };

  const getConditionChip = (condition) => {
    const colorMap = { new: 'success', good: 'info', fair: 'warning', poor: 'warning', damaged: 'error', obsolete: 'error' };
    return <Chip label={condition} color={colorMap[condition] || 'default'} size="small" variant="outlined" />;
  };



  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssetIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Asset Register
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all fixed assets
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/fixed-assets/register/new')}
        >
          New Asset
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth size="small"
              placeholder="Search by code, name, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadData}>Search</Button>
          </Grid>
          <Grid item xs={6} sm={2} md={1}>
            <Button fullWidth variant="text" startIcon={<Refresh />} onClick={() => { setSearch(''); setStatusFilter(''); dispatch(fetchAssets({})); }}>Reset</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Asset Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purchase Cost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Book Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No assets found. Click "New Asset" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleView(asset)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{asset.assetCode}</Typography>
                    </TableCell>
                    <TableCell>{asset.assetName}</TableCell>
                    <TableCell>{asset.category?.categoryName || '-'}</TableCell>
                    <TableCell>{formatCurrency(asset.purchaseCost)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600} color={asset.currentBookValue > 0 ? 'primary' : 'text.secondary'}>
                        {formatCurrency(asset.currentBookValue)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getConditionChip(asset.condition)}</TableCell>
                    <TableCell>{getStatusChip(asset.status)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {(asset.status === 'draft' || asset.status === 'active' || asset.status === 'under_maintenance' || asset.status === 'transferred') && (
                          <Tooltip title="Change Status">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); openStatusDialog(asset); }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(asset.id); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {asset.status === 'draft' && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(asset.id); }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssetIcon color="primary" />
            <Typography variant="h6">{isEditing ? 'Edit Asset' : 'New Asset'}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Asset Code" name="assetCode" value={form.assetCode} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Asset Name" name="assetName" value={form.assetName} onChange={handleChange} error={!!formErrors.assetName} helperText={formErrors.assetName} required size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Category</InputLabel>
                <Select name="categoryId" value={form.categoryId} onChange={handleChange} label="Category" error={!!formErrors.categoryId}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {activeAssetCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.categoryCode} - {cat.categoryName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Purchase Cost" name="purchaseCost" type="number" value={form.purchaseCost} onChange={handleChange} error={!!formErrors.purchaseCost} helperText={formErrors.purchaseCost} required size="small" inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Residual Value" name="residualValue" type="number" value={form.residualValue} onChange={handleChange} size="small" inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Useful Life (Years)" name="usefulLife" type="number" value={form.usefulLife} onChange={handleChange} size="small" inputProps={{ min: 1, max: 100 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Depreciation Method</InputLabel>
                <Select name="depreciationMethod" value={form.depreciationMethod} onChange={handleChange} label="Depreciation Method">
                  {DEPRECIATION_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select name="condition" value={form.condition} onChange={handleChange} label="Condition">
                  {CONDITIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Serial Number" name="serialNumber" value={form.serialNumber} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Model" name="model" value={form.model} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Purchase Date" name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Capitalization Date" name="capitalizationDate" type="date" value={form.capitalizationDate} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Warranty Expiry" name="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select name="supplierId" value={form.supplierId} onChange={handleChange} label="Supplier">
                  <MenuItem value=""><em>None</em></MenuItem>
                  {suppliers?.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.code} - {s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Department" name="department" value={form.department} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Custodian" name="custodian" value={form.custodian} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location" name="location" value={form.location} onChange={handleChange} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" name="notes" value={form.notes} onChange={handleChange} multiline rows={2} size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{isEditing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Change Asset Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current Status: <Chip label={STATUSES.find(s => s.value === statusAction.currentStatus)?.label || statusAction.currentStatus} size="small" />
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>New Status</InputLabel>
            <Select
              value={statusAction.newStatus}
              label="New Status"
              onChange={(e) => setStatusAction((prev) => ({ ...prev, newStatus: e.target.value }))}
            >
              {(['draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'].filter(
                (s) => {
                  const transitionMap = { draft: ['active'], active: ['disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'], under_maintenance: ['active', 'disposed', 'retired'], transferred: ['active'] };
                  return (transitionMap[statusAction.currentStatus] || []).includes(s);
                }
              )).map((s) => (
                <MenuItem key={s} value={s}>{STATUSES.find(st => st.value === s)?.label || s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange}>Change Status</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this asset? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssetIcon color="primary" />
            <Typography variant="h6">Asset Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewAsset && (
            <Grid container spacing={2}>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Asset Code</Typography><Typography variant="body1" fontWeight={600}>{viewAsset.assetCode}</Typography></Grid>
              <Grid item xs={8}><Typography variant="caption" color="text.secondary">Asset Name</Typography><Typography variant="body1" fontWeight={600}>{viewAsset.assetName}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body1">{viewAsset.category?.categoryName || '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}>{getStatusChip(viewAsset.status)}</Box></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Condition</Typography><Box sx={{ mt: 0.5 }}>{getConditionChip(viewAsset.condition)}</Box></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Purchase Cost</Typography><Typography variant="body1" fontWeight={600}>{formatCurrency(viewAsset.purchaseCost)}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Current Book Value</Typography><Typography variant="body1" fontWeight={600} color="primary">{formatCurrency(viewAsset.currentBookValue)}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Accumulated Depreciation</Typography><Typography variant="body1">{formatCurrency(viewAsset.accumulatedDepreciation)}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Residual Value</Typography><Typography variant="body1">{formatCurrency(viewAsset.residualValue)}</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Useful Life</Typography><Typography variant="body1">{viewAsset.usefulLife} years</Typography></Grid>
              <Grid item xs={4}><Typography variant="caption" color="text.secondary">Depreciation Method</Typography><Typography variant="body1">{DEPRECIATION_METHODS.find(m => m.value === viewAsset.depreciationMethod)?.label || viewAsset.depreciationMethod}</Typography></Grid>
              {viewAsset.serialNumber && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography variant="body1">{viewAsset.serialNumber}</Typography></Grid>}
              {viewAsset.manufacturer && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Manufacturer</Typography><Typography variant="body1">{viewAsset.manufacturer}</Typography></Grid>}
              {viewAsset.model && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Model</Typography><Typography variant="body1">{viewAsset.model}</Typography></Grid>}
              {viewAsset.supplier && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Supplier</Typography><Typography variant="body1">{viewAsset.supplier.name}</Typography></Grid>}
              {viewAsset.location && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{viewAsset.location}</Typography></Grid>}
              {viewAsset.department && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body1">{viewAsset.department}</Typography></Grid>}
              {viewAsset.custodian && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Custodian</Typography><Typography variant="body1">{viewAsset.custodian}</Typography></Grid>}
              {viewAsset.purchaseDate && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Purchase Date</Typography><Typography variant="body1">{viewAsset.purchaseDate}</Typography></Grid>}
              {viewAsset.warrantyExpiry && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Warranty Expiry</Typography><Typography variant="body1">{viewAsset.warrantyExpiry}</Typography></Grid>}
              {viewAsset.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body1">{viewAsset.notes}</Typography></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;
