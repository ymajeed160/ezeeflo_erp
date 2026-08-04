import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Alert, CircularProgress,
  Tooltip, InputAdornment, Autocomplete, Grid, Tabs, Tab,
} from '@mui/material';
import {
  Add, Edit, Delete, Block, CheckCircle, Search, FilterList,
  Refresh, Inventory, ArrowBack,
} from '@mui/icons-material';
import {
  fetchItems, fetchItem, createItem, updateItem, deleteItem, toggleItemStatus, clearError, clearCurrentItem,
} from '../store/slices/itemSlice';
import { fetchItemCategories } from '../store/slices/itemCategorySlice';
import accountApi from '../services/accountApi';
import SystemConfigApi from '../services/systemConfigApi';

const ITEM_TYPES = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
];

const UOM_OPTIONS = [
  { value: 'Each', label: 'Each' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Liter', label: 'Liter' },
  { value: 'Box', label: 'Box' },
  { value: 'Carton', label: 'Carton' },
  { value: 'Meter', label: 'Meter' },
  { value: 'Hour', label: 'Hour' },
  { value: 'Day', label: 'Day' },
  { value: 'Piece', label: 'Piece' },
  { value: 'Pack', label: 'Pack' },
];

const Items = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  const { items, currentItem, loading, error, totalPages } = useSelector((state) => state.items);
  const { items: categories } = useSelector((state) => state.itemCategories);

  // Determine view mode from URL
  const isNew = pathParts.includes('new');
  const isEdit = pathParts.includes('edit');
  const isView = id && !isNew && !isEdit;
  const isDialog = isNew || isEdit || isView;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ categoryId: '', itemType: '', isActive: '', model: '', size: '', ram: '', processor: '', ssd: '', generation: '', colour: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Account options from API
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Item definitions (model, size, ram, etc.)
  const [itemDefinitions, setItemDefinitions] = useState([]);

  // Form state
  const [form, setForm] = useState({
    categoryId: '',
    itemCode: '',
    name: '',
    description: '',
    model: '',
    size: '',
    ram: '',
    processor: '',
    ssd: '',
    generation: '',
    colour: '',
    itemType: 'product',
    unitOfMeasure: 'Each',
    costPrice: '',
    sellingPrice: '',
    taxPercentage: '',
    isInventoryTracked: true,
    incomeAccountId: '',
    expenseAccountId: '',
    inventoryAccountId: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // Open dialog based on route
  useEffect(() => {
    if (isNew) {
      setForm({
        categoryId: '', itemCode: '', name: '', description: '',
        model: '', size: '', ram: '', processor: '', ssd: '', generation: '', colour: '',
        itemType: 'product', unitOfMeasure: 'Each',
        costPrice: '', sellingPrice: '', taxPercentage: '',
        isInventoryTracked: true,
        incomeAccountId: '', expenseAccountId: '', inventoryAccountId: '',
        isActive: true,
      });
      setFormErrors({});
      setOpen(true);
    } else if (isEdit && currentItem) {
      setForm({
        categoryId: currentItem.categoryId || '',
        itemCode: currentItem.itemCode || '',
        name: currentItem.name || '',
        description: currentItem.description || '',
        model: currentItem.model || '',
        size: currentItem.size || '',
        ram: currentItem.ram || '',
        processor: currentItem.processor || '',
        ssd: currentItem.ssd || '',
        generation: currentItem.generation || '',
        colour: currentItem.colour || '',
        itemType: currentItem.itemType || 'product',
        unitOfMeasure: currentItem.unitOfMeasure || 'Each',
        costPrice: currentItem.costPrice != null ? String(currentItem.costPrice) : '',
        sellingPrice: currentItem.sellingPrice != null ? String(currentItem.sellingPrice) : '',
        taxPercentage: currentItem.taxPercentage != null ? String(currentItem.taxPercentage) : '',
        isInventoryTracked: currentItem.isInventoryTracked !== false,
        incomeAccountId: currentItem.incomeAccountId || '',
        expenseAccountId: currentItem.expenseAccountId || '',
        inventoryAccountId: currentItem.inventoryAccountId || '',
        isActive: currentItem.isActive !== false,
      });
      setFormErrors({});
      setOpen(true);
    } else if (isView && currentItem) {
      setOpen(true);
    }
  }, [isNew, isEdit, isView, currentItem]);

  // Handle dialog close -> navigate back to list
  const handleClose = () => {
    dispatch(clearCurrentItem());
    setOpen(false);
    navigate('/app/inventory/items');
  };

  // Load data
  useEffect(() => {
    dispatch(fetchItems({ search, ...filters, page, limit: perPage }));
    dispatch(fetchItemCategories());
  }, [dispatch, search, filters, page]);

  // Load accounts for combo boxes
  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await accountApi.getAll({ limit: 500, isActive: 'all' });
        setAccounts(data.data || data.rows || []);
      } catch (err) {
        console.error('Failed to load accounts:', err);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };
    loadAccounts();
  }, []);

  // Load item definitions for dropdowns
  useEffect(() => {
    const loadDefs = async () => {
      try {
        const res = await SystemConfigApi.getItemDefinitions();
        if (res.success) setItemDefinitions(res.data || []);
      } catch (err) {
        console.error('Failed to load item definitions:', err);
        setItemDefinitions([]);
      }
    };
    loadDefs();
  }, []);

  // Load current item for edit/view
  useEffect(() => {
    if (id && !isNew) {
      if (!currentItem || String(currentItem.id) !== String(id)) {
        dispatch(fetchItem(id));
      }
    }
  }, [id, isNew, currentItem, dispatch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Item name is required';
    if (!form.itemCode.trim()) errors.itemCode = 'Item code is required';
    if (form.itemType === 'product' && !form.inventoryAccountId) {
      errors.inventoryAccountId = 'Inventory account is required for products';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      categoryId: form.categoryId || null,
      itemCode: form.itemCode.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      model: form.model?.trim() || null,
      size: form.size?.trim() || null,
      ram: form.ram?.trim() || null,
      processor: form.processor?.trim() || null,
      ssd: form.ssd?.trim() || null,
      generation: form.generation?.trim() || null,
      colour: form.colour?.trim() || null,
      itemType: form.itemType,
      unitOfMeasure: form.unitOfMeasure,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
      taxPercentage: form.taxPercentage ? Number(form.taxPercentage) : null,
      isInventoryTracked: form.itemType === 'service' ? false : form.isInventoryTracked,
      incomeAccountId: form.incomeAccountId || null,
      expenseAccountId: form.expenseAccountId || null,
      inventoryAccountId: form.itemType === 'service' ? null : (form.inventoryAccountId || null),
      isActive: form.isActive,
    };
    if (isEdit) {
      dispatch(updateItem({ id, data: payload }));
      handleClose();
    } else {
      dispatch(createItem(payload));
      handleClose();
    }
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteItem(itemId));
    }
  };

  const handleToggleStatus = (itemId) => {
    dispatch(toggleItemStatus(itemId));
  };

  const handleEditClick = (item) => {
    navigate(`/app/inventory/items/${item.id}/edit`);
  };

  const handleViewClick = (item) => {
    navigate(`/app/inventory/items/${item.id}`);
  };

  // Account options for dropdowns
  const accountOptions = useMemo(() => {
    return accounts.map((a) => ({
      id: a.id,
      label: `${a.code} - ${a.name}`,
      name: a.name,
      code: a.code,
    }));
  }, [accounts]);

  const findAccountOption = (accountId) => {
    if (!accountId) return null;
    return accountOptions.find((a) => a.id === accountId) || null;
  };

  // Category options
  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({ id: c.id, label: c.name }));
  }, [categories]);

  const findCategoryOption = (catId) => {
    if (!catId) return null;
    return categoryOptions.find((c) => c.id === catId) || null;
  };

  const itemTypeOption = (type) => ITEM_TYPES.find((t) => t.value === type) || null;
  const uomOption = UOM_OPTIONS.find((u) => u.value === form.unitOfMeasure) || UOM_OPTIONS[0];

  // Definition options for each category
  const getDefOptions = (cat) => {
    return itemDefinitions
      .filter(d => d.category === cat && d.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(d => ({ value: d.name, label: d.name }));
  };

  const modelOptions = useMemo(() => getDefOptions('model'), [itemDefinitions]);
  const sizeOptions = useMemo(() => getDefOptions('size'), [itemDefinitions]);
  const ramOptions = useMemo(() => getDefOptions('ram'), [itemDefinitions]);
  const processorOptions = useMemo(() => getDefOptions('processor'), [itemDefinitions]);
  const ssdOptions = useMemo(() => getDefOptions('ssd'), [itemDefinitions]);
  const generationOptions = useMemo(() => getDefOptions('generation'), [itemDefinitions]);
  const colourOptions = useMemo(() => getDefOptions('colour'), [itemDefinitions]);

  // Detail view content
  const renderDetailContent = (item) => (
    <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Item Code</Typography>
          <Typography fontWeight={600}>{item.itemCode}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Item Name</Typography>
          <Typography fontWeight={600}>{item.name}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Category</Typography>
          <Typography>{item.category?.name || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Item Type</Typography>
          <Chip label={item.itemType} size="small" color={item.itemType === 'product' ? 'primary' : 'secondary'} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Unit of Measure</Typography>
          <Typography>{item.unitOfMeasure}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Status</Typography>
          <Chip
            icon={item.isActive ? <CheckCircle /> : <Block />}
            label={item.isActive ? 'Active' : 'Inactive'}
            size="small"
            color={item.isActive ? 'success' : 'error'}
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Cost Price</Typography>
          <Typography>{item.costPrice != null ? Number(item.costPrice).toFixed(2) : '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Selling Price</Typography>
          <Typography>{item.sellingPrice != null ? Number(item.sellingPrice).toFixed(2) : '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Tax %</Typography>
          <Typography>{item.taxPercentage != null ? `${item.taxPercentage}%` : '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Inventory Tracked</Typography>
          <Typography>{item.isInventoryTracked ? 'Yes' : 'No'}</Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Description</Typography>
        <Typography>{item.description || 'No description'}</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Income Account</Typography>
          <Typography>{item.IncomeAccount ? `${item.IncomeAccount.code} - ${item.IncomeAccount.name}` : '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Expense Account</Typography>
          <Typography>{item.ExpenseAccount ? `${item.ExpenseAccount.code} - ${item.ExpenseAccount.name}` : '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Inventory Account</Typography>
          <Typography>{item.InventoryAccount ? `${item.InventoryAccount.code} - ${item.InventoryAccount.name}` : '-'}</Typography>
        </Box>
      </Box>
    </Box>
  );

  // Form content
  const renderFormContent = () => (
    <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={categoryOptions}
            value={findCategoryOption(form.categoryId)}
            onChange={(_, v) => setForm({ ...form, categoryId: v?.id || '' })}
            renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Item Code"
            value={form.itemCode}
            onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
            error={!!formErrors.itemCode}
            helperText={formErrors.itemCode}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Item Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!formErrors.name}
            helperText={formErrors.name}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={modelOptions}
            value={modelOptions.find(o => o.value === form.model) || null}
            inputValue={form.model || ''}
            onInputChange={(_, v) => setForm({ ...form, model: v })}
            onChange={(_, v) => setForm({ ...form, model: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="Model" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={sizeOptions}
            value={sizeOptions.find(o => o.value === form.size) || null}
            inputValue={form.size || ''}
            onInputChange={(_, v) => setForm({ ...form, size: v })}
            onChange={(_, v) => setForm({ ...form, size: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="Size" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={ramOptions}
            value={ramOptions.find(o => o.value === form.ram) || null}
            inputValue={form.ram || ''}
            onInputChange={(_, v) => setForm({ ...form, ram: v })}
            onChange={(_, v) => setForm({ ...form, ram: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="RAM" fullWidth placeholder="e.g. 16GB" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={processorOptions}
            value={processorOptions.find(o => o.value === form.processor) || null}
            inputValue={form.processor || ''}
            onInputChange={(_, v) => setForm({ ...form, processor: v })}
            onChange={(_, v) => setForm({ ...form, processor: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="Processor" fullWidth placeholder="e.g. Intel i7" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={ssdOptions}
            value={ssdOptions.find(o => o.value === form.ssd) || null}
            inputValue={form.ssd || ''}
            onInputChange={(_, v) => setForm({ ...form, ssd: v })}
            onChange={(_, v) => setForm({ ...form, ssd: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="SSD" fullWidth placeholder="e.g. 512GB" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={generationOptions}
            value={generationOptions.find(o => o.value === form.generation) || null}
            inputValue={form.generation || ''}
            onInputChange={(_, v) => setForm({ ...form, generation: v })}
            onChange={(_, v) => setForm({ ...form, generation: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="Generation" fullWidth placeholder="e.g. 12th Gen" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            freeSolo
            options={colourOptions}
            value={colourOptions.find(o => o.value === form.colour) || null}
            inputValue={form.colour || ''}
            onInputChange={(_, v) => setForm({ ...form, colour: v })}
            onChange={(_, v) => setForm({ ...form, colour: v?.value || '' })}
            renderInput={(params) => <TextField {...params} label="Colour" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={ITEM_TYPES}
            value={itemTypeOption(form.itemType)}
            onChange={(_, v) => {
              const newType = v?.value || 'product';
              setForm({
                ...form,
                itemType: newType,
                isInventoryTracked: newType === 'service' ? false : form.isInventoryTracked,
              });
            }}
            getOptionLabel={(o) => o.label}
            renderInput={(params) => <TextField {...params} label="Item Type" fullWidth />}
            disableClearable
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={UOM_OPTIONS}
            value={uomOption}
            onChange={(_, v) => setForm({ ...form, unitOfMeasure: v?.value || 'Each' })}
            getOptionLabel={(o) => o.label}
            renderInput={(params) => <TextField {...params} label="Unit of Measure" fullWidth />}
            disableClearable
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Cost Price"
            type="number"
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Selling Price"
            type="number"
            value={form.sellingPrice}
            onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Tax Percentage"
            type="number"
            value={form.taxPercentage}
            onChange={(e) => setForm({ ...form, taxPercentage: e.target.value })}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={accountOptions}
            value={findAccountOption(form.incomeAccountId)}
            onChange={(_, v) => setForm({ ...form, incomeAccountId: v?.id || '' })}
            renderInput={(params) => <TextField {...params} label="Income Account" fullWidth />}
            loading={accountsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={accountOptions}
            value={findAccountOption(form.expenseAccountId)}
            onChange={(_, v) => setForm({ ...form, expenseAccountId: v?.id || '' })}
            renderInput={(params) => <TextField {...params} label="Expense Account" fullWidth />}
            loading={accountsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={accountOptions}
            value={findAccountOption(form.inventoryAccountId)}
            onChange={(_, v) => setForm({ ...form, inventoryAccountId: v?.id || '' })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Inventory Account"
                error={!!formErrors.inventoryAccountId}
                helperText={formErrors.inventoryAccountId || (form.itemType === 'service' ? 'Optional for services' : 'Required for products')}
                fullWidth
              />
            )}
            loading={accountsLoading}
            disabled={form.itemType === 'service'}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={form.isInventoryTracked}
                onChange={(e) => setForm({ ...form, isInventoryTracked: e.target.checked })}
                disabled={form.itemType === 'service'}
              />
            }
            label="Track Inventory"
          />
          {form.itemType === 'service' && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Inventory tracking is not available for services
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Items</Typography>
          <Typography variant="body2" color="text.secondary">Manage products and services</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/inventory/items/new')}>
          Add Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Search & Filter Bar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search items..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
            sx={{ minWidth: 250, flex: 1 }}
          />
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="medium"
            sx={{ height: 40 }}
          >
            Filters
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => dispatch(fetchItems({ search, ...filters, page, limit: perPage }))}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.categoryId}
                label="Category"
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={filters.itemType}
                label="Item Type"
                onChange={(e) => handleFilterChange('itemType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.isActive}
                label="Status"
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              size="small"
              options={modelOptions}
              value={modelOptions.find(o => o.value === filters.model) || null}
              inputValue={filters.model || ''}
              onInputChange={(_, v) => handleFilterChange('model', v)}
              onChange={(_, v) => handleFilterChange('model', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="Model" />}
              sx={{ minWidth: 140 }}
            />
            <Autocomplete
              size="small"
              options={sizeOptions}
              value={sizeOptions.find(o => o.value === filters.size) || null}
              inputValue={filters.size || ''}
              onInputChange={(_, v) => handleFilterChange('size', v)}
              onChange={(_, v) => handleFilterChange('size', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="Size" />}
              sx={{ minWidth: 120 }}
            />
            <Autocomplete
              size="small"
              options={ramOptions}
              value={ramOptions.find(o => o.value === filters.ram) || null}
              inputValue={filters.ram || ''}
              onInputChange={(_, v) => handleFilterChange('ram', v)}
              onChange={(_, v) => handleFilterChange('ram', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="RAM" />}
              sx={{ minWidth: 110 }}
            />
            <Autocomplete
              size="small"
              options={processorOptions}
              value={processorOptions.find(o => o.value === filters.processor) || null}
              inputValue={filters.processor || ''}
              onInputChange={(_, v) => handleFilterChange('processor', v)}
              onChange={(_, v) => handleFilterChange('processor', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="Processor" />}
              sx={{ minWidth: 140 }}
            />
            <Autocomplete
              size="small"
              options={ssdOptions}
              value={ssdOptions.find(o => o.value === filters.ssd) || null}
              inputValue={filters.ssd || ''}
              onInputChange={(_, v) => handleFilterChange('ssd', v)}
              onChange={(_, v) => handleFilterChange('ssd', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="SSD" />}
              sx={{ minWidth: 110 }}
            />
            <Autocomplete
              size="small"
              options={generationOptions}
              value={generationOptions.find(o => o.value === filters.generation) || null}
              inputValue={filters.generation || ''}
              onInputChange={(_, v) => handleFilterChange('generation', v)}
              onChange={(_, v) => handleFilterChange('generation', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="Generation" />}
              sx={{ minWidth: 130 }}
            />
            <Autocomplete
              size="small"
              options={colourOptions}
              value={colourOptions.find(o => o.value === filters.colour) || null}
              inputValue={filters.colour || ''}
              onInputChange={(_, v) => handleFilterChange('colour', v)}
              onChange={(_, v) => handleFilterChange('colour', v?.value || '')}
              renderInput={(params) => <TextField {...params} label="Colour" />}
              sx={{ minWidth: 120 }}
            />
          </Box>
        )}
      </Paper>

      {/* Items Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Item Code</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Cost</strong></TableCell>
              <TableCell><strong>Sell</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center" sx={{ width: 140 }}><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress sx={{ my: 3 }} />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No items found. Click "Add Item" to create one.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewClick(item)}>
                  <TableCell>
                    <Typography fontWeight={600} color="primary.main" component="span">
                      {item.itemCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.itemType}
                      size="small"
                      variant="outlined"
                      color={item.itemType === 'product' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{item.costPrice != null ? Number(item.costPrice).toFixed(2) : '-'}</TableCell>
                  <TableCell>{item.sellingPrice != null ? Number(item.sellingPrice).toFixed(2) : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={item.isActive ? <CheckCircle /> : <Block />}
                      label={item.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={item.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditClick(item)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Toggle Status">
                      <IconButton onClick={() => handleToggleStatus(item.id)} size="small">
                        {item.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(item.id)} size="small" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <Typography sx={{ lineHeight: '36px', px: 1 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Add / Edit / View Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleClose} size="small">
              <ArrowBack />
            </IconButton>
            {isView ? 'Item Details' : isEdit ? 'Edit Item' : 'Add New Item'}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {isView && currentItem
            ? renderDetailContent(currentItem)
            : renderFormContent()}
        </DialogContent>
        {!isView && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        )}
        {isView && currentItem && (
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                navigate(`/app/inventory/items/${currentItem.id}/edit`);
              }}
            >
              Edit
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default Items;