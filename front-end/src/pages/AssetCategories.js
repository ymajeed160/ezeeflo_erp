import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Tooltip, Grid, Switch, FormControlLabel,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, Block, CheckCircle, Search, Refresh,
  ArrowBack, Category as CategoryIcon,
} from '@mui/icons-material';
import {
  fetchAssetCategories, createAssetCategory, updateAssetCategory, deleteAssetCategory,
  toggleAssetCategoryStatus, clearError, clearSelected,
} from '../store/slices/assetCategorySlice';
import { fetchAccounts } from '../store/slices/accountSlice';

const DEPRECIATION_METHODS = [
  { value: 'straight_line', label: 'Straight Line' },
  { value: 'declining_balance', label: 'Declining Balance' },
  { value: 'double_declining_balance', label: 'Double Declining Balance' },
  { value: 'units_of_production', label: 'Units of Production' },
  { value: 'manual', label: 'Manual' },
];

const INITIAL_FORM = {
  categoryCode: '',
  categoryName: '',
  usefulLifeYears: 5,
  depreciationMethod: 'straight_line',
  defaultAssetAccountId: '',
  accumulatedDepreciationAccountId: '',
  depreciationExpenseAccountId: '',
  gainOnDisposalAccountId: '',
  lossOnDisposalAccountId: '',
  defaultTaxAccountId: '',
  residualValuePercentage: '',
  description: '',
  isActive: true,
};

const AssetCategories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);

  const {
    assetCategories,
    selectedAssetCategory,
    loading,
    error,
  } = useSelector((state) => state.assetCategories);

  const { items: accounts } = useSelector((state) => state.accounts);

  const isEditing = !!id || location.pathname.includes('/edit');
  const isNew = location.pathname.includes('/new');
  const isView = location.pathname.includes('/view');

  const loadData = useCallback(() => {
    dispatch(fetchAssetCategories({ search }));
  }, [dispatch, search]);

  const loadAccounts = useCallback(() => {
    dispatch(fetchAccounts({ limit: 999 }));
  }, [dispatch]);

  useEffect(() => {
    loadData();
    loadAccounts();
  }, [loadData, loadAccounts]);

  useEffect(() => {
    if (isEditing && id) {
      const category = assetCategories.find((c) => c.id === id);
      if (category) {
        setForm({
          categoryCode: category.categoryCode || '',
          categoryName: category.categoryName || '',
          usefulLifeYears: category.usefulLifeYears || 5,
          depreciationMethod: category.depreciationMethod || 'straight_line',
          defaultAssetAccountId: category.defaultAssetAccountId || '',
          accumulatedDepreciationAccountId: category.accumulatedDepreciationAccountId || '',
          depreciationExpenseAccountId: category.depreciationExpenseAccountId || '',
          gainOnDisposalAccountId: category.gainOnDisposalAccountId || '',
          lossOnDisposalAccountId: category.lossOnDisposalAccountId || '',
          defaultTaxAccountId: category.defaultTaxAccountId || '',
          residualValuePercentage: category.residualValuePercentage ?? '',
          description: category.description || '',
          isActive: category.isActive !== false,
        });
        setDialogOpen(true);
      }
    } else if (isNew) {
      setForm(INITIAL_FORM);
      setDialogOpen(true);
    }
  }, [isEditing, isNew, id, assetCategories]);

  useEffect(() => {
    if (isView && id && selectedAssetCategory) {
      setViewCategory(selectedAssetCategory);
      setViewDialogOpen(true);
    } else if (isView && id && !selectedAssetCategory) {
      dispatch(fetchAssetCategories({ search }));
    }
  }, [isView, id, selectedAssetCategory, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSelected());
    };
  }, [dispatch]);

  const validate = () => {
    const errors = {};
    if (!form.categoryCode.trim()) errors.categoryCode = 'Category code is required';
    if (!form.categoryName.trim()) errors.categoryName = 'Category name is required';
    if (!form.usefulLifeYears) errors.usefulLifeYears = 'Useful life is required';
    if (!form.depreciationMethod) errors.depreciationMethod = 'Depreciation method is required';
    if (form.residualValuePercentage !== '' && (isNaN(form.residualValuePercentage) || parseFloat(form.residualValuePercentage) < 0 || parseFloat(form.residualValuePercentage) > 100)) {
      errors.residualValuePercentage = 'Must be between 0 and 100';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data = {
      ...form,
      usefulLifeYears: parseInt(form.usefulLifeYears, 10),
      residualValuePercentage: form.residualValuePercentage === '' ? 0 : parseFloat(form.residualValuePercentage),
      isActive: form.isActive,
    };

    if (isEditing && id) {
      await dispatch(updateAssetCategory({ id, data }));
    } else {
      await dispatch(createAssetCategory(data));
    }

    setDialogOpen(false);
    navigate('/app/fixed-assets/categories');
  };

  const handleToggleStatus = async (categoryId) => {
    await dispatch(toggleAssetCategoryStatus(categoryId));
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await dispatch(deleteAssetCategory(deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const handleView = (category) => {
    setViewCategory(category);
    setViewDialogOpen(true);
  };

  const handleEdit = (categoryId) => {
    navigate(`/app/fixed-assets/categories/${categoryId}/edit`);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      loadData();
    }
  };

  const handleRefresh = () => {
    setSearch('');
    dispatch(fetchAssetCategories({}));
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
    navigate('/app/fixed-assets/categories');
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewCategory(null);
    navigate('/app/fixed-assets/categories');
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

  const getDepreciationLabel = (method) => {
    const found = DEPRECIATION_METHODS.find((m) => m.value === method);
    return found ? found.label : method;
  };

  const getAccountName = (accountId) => {
    if (!accountId || !accounts) return '-';
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : '-';
  };

  // Filter accounts by type
  const assetAccounts = accounts?.filter((acc) => acc.type === 'asset') || [];
  const expenseAccounts = accounts?.filter((acc) => acc.type === 'expense') || [];
  const incomeAccounts = accounts?.filter((acc) => acc.type === 'income') || [];
  const liabilityAccounts = accounts?.filter((acc) => acc.type === 'liability') || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Asset Categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage fixed asset categories and depreciation settings
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/fixed-assets/categories/new')}
        >
          New Category
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Search & Actions Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, name, or method..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Search />}
              onClick={loadData}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Button
              fullWidth
              variant="text"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Useful Life (Yrs)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Depreciation Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Residual Value %</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assetCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No asset categories found. Click "New Category" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assetCategories.map((category) => (
                  <TableRow
                    key={category.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleView(category)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {category.categoryCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{category.categoryName}</TableCell>
                    <TableCell>{category.usefulLifeYears}</TableCell>
                    <TableCell>
                      <Chip
                        label={getDepreciationLabel(category.depreciationMethod)}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{category.residualValuePercentage}%</TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title={category.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            color={category.isActive ? 'warning' : 'success'}
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(category.id); }}
                          >
                            {category.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => { e.stopPropagation(); handleEdit(category.id); }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(category.id); }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
            <CategoryIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Edit Asset Category' : 'New Asset Category'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Category Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category Code"
                name="categoryCode"
                value={form.categoryCode}
                onChange={handleChange}
                error={!!formErrors.categoryCode}
                helperText={formErrors.categoryCode}
                placeholder="e.g., FAC-000001"
                required
              />
            </Grid>
            {/* Category Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category Name"
                name="categoryName"
                value={form.categoryName}
                onChange={handleChange}
                error={!!formErrors.categoryName}
                helperText={formErrors.categoryName}
                placeholder="e.g., IT Equipment"
                required
              />
            </Grid>
            {/* Useful Life */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Useful Life (Years)"
                name="usefulLifeYears"
                type="number"
                value={form.usefulLifeYears}
                onChange={handleChange}
                error={!!formErrors.usefulLifeYears}
                helperText={formErrors.usefulLifeYears}
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>
            {/* Depreciation Method */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Depreciation Method</InputLabel>
                <Select
                  name="depreciationMethod"
                  value={form.depreciationMethod}
                  onChange={handleChange}
                  label="Depreciation Method"
                  error={!!formErrors.depreciationMethod}
                >
                  {DEPRECIATION_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Residual Value % */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Residual Value %"
                name="residualValuePercentage"
                type="number"
                value={form.residualValuePercentage}
                onChange={handleChange}
                error={!!formErrors.residualValuePercentage}
                helperText={formErrors.residualValuePercentage || 'Percentage of cost'}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            {/* Default Asset Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Asset Account</InputLabel>
                <Select
                  name="defaultAssetAccountId"
                  value={form.defaultAssetAccountId}
                  onChange={handleChange}
                  label="Default Asset Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {assetAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Accumulated Depreciation Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Accumulated Depreciation Account</InputLabel>
                <Select
                  name="accumulatedDepreciationAccountId"
                  value={form.accumulatedDepreciationAccountId}
                  onChange={handleChange}
                  label="Accumulated Depreciation Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {assetAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Depreciation Expense Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Depreciation Expense Account</InputLabel>
                <Select
                  name="depreciationExpenseAccountId"
                  value={form.depreciationExpenseAccountId}
                  onChange={handleChange}
                  label="Depreciation Expense Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {expenseAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Gain on Disposal Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gain on Disposal Account</InputLabel>
                <Select
                  name="gainOnDisposalAccountId"
                  value={form.gainOnDisposalAccountId}
                  onChange={handleChange}
                  label="Gain on Disposal Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {incomeAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Loss on Disposal Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loss on Disposal Account</InputLabel>
                <Select
                  name="lossOnDisposalAccountId"
                  value={form.lossOnDisposalAccountId}
                  onChange={handleChange}
                  label="Loss on Disposal Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {expenseAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Default Tax Account */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Tax Account</InputLabel>
                <Select
                  name="defaultTaxAccountId"
                  value={form.defaultTaxAccountId}
                  onChange={handleChange}
                  label="Default Tax Account"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {liabilityAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            {/* Active Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this asset category? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">Asset Category Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewCategory && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Category Code</Typography>
                <Typography variant="body1" fontWeight={600}>{viewCategory.categoryCode}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Category Name</Typography>
                <Typography variant="body1" fontWeight={600}>{viewCategory.categoryName}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Useful Life</Typography>
                <Typography variant="body1">{viewCategory.usefulLifeYears} years</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Depreciation Method</Typography>
                <Typography variant="body1">{getDepreciationLabel(viewCategory.depreciationMethod)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Residual Value</Typography>
                <Typography variant="body1">{viewCategory.residualValuePercentage}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Default Asset Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.defaultAssetAccountId)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Accumulated Depreciation Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.accumulatedDepreciationAccountId)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Depreciation Expense Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.depreciationExpenseAccountId)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Gain on Disposal Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.gainOnDisposalAccountId)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Loss on Disposal Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.lossOnDisposalAccountId)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Default Tax Account</Typography>
                <Typography variant="body1">{getAccountName(viewCategory.defaultTaxAccountId)}</Typography>
              </Grid>
              {viewCategory.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{viewCategory.description}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip
                  label={viewCategory.isActive ? 'Active' : 'Inactive'}
                  color={viewCategory.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
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

export default AssetCategories;
