import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, TextField, Tooltip,
  Autocomplete, FormControlLabel, Switch, Typography, InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import itemApi from '../../services/itemApi';
import accountApi from '../../services/accountApi';
import SystemConfigApi from '../../services/systemConfigApi';
import { fetchItemCategories } from '../../store/slices/itemCategorySlice';
import usePermissions from '../../hooks/usePermissions';
import { apiError, apiSuccess } from '../../utils/toast';
import QuickCreate from './QuickCreate';

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

const rand = (len = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const emptyForm = () => ({
  categoryId: '',
  itemCode: `ITM-${rand()}`,
  name: '',
  description: '',
  model: '', size: '', ram: '', processor: '', ssd: '', generation: '', colour: '',
  itemType: 'product',
  unitOfMeasure: 'Each',
  costPrice: '',
  sellingPrice: '',
  taxPercentage: '',
  incomeAccountId: '',
  expenseAccountId: '',
  inventoryAccountId: '',
  isInventoryTracked: true,
  isActive: true,
});

/**
 * Full "Add New Item" quick-create modal (mirrors the New Item form).
 * Used by the QuickCreate component when entityKey === 'item'.
 */
const QuickCreateItem = ({ onCreated, disabled = false, size = 'small', tooltip }) => {
  const dispatch = useDispatch();
  const { hasPermission, loading: permLoading } = usePermissions();
  const categories = useSelector((s) => s.itemCategories?.items || []);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [itemDefinitions, setItemDefinitions] = useState([]);

  useEffect(() => {
    dispatch(fetchItemCategories());
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await accountApi.getAll({ limit: 500, isActive: 'all' });
        setAccounts(data.data || data.rows || []);
      } catch { setAccounts([]); } finally { setAccountsLoading(false); }
    };
    const loadDefs = async () => {
      try {
        const res = await SystemConfigApi.getItemDefinitions();
        if (res.success) setItemDefinitions(res.data || []);
      } catch { setItemDefinitions([]); }
    };
    loadAccounts();
    loadDefs();
  }, [dispatch]);

  const accountOptions = useMemo(() => accounts.map((a) => ({ id: a.id, label: `${a.code} - ${a.name}` })), [accounts]);
  const categoryOptions = useMemo(() => categories.map((c) => ({ id: c.id, label: c.name })), [categories]);

  const getDefOptions = (cat) => itemDefinitions
    .filter((d) => d.category === cat && d.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((d) => ({ value: d.name, label: d.name }));

  const modelOptions = useMemo(() => getDefOptions('model'), [itemDefinitions]);
  const sizeOptions = useMemo(() => getDefOptions('size'), [itemDefinitions]);
  const ramOptions = useMemo(() => getDefOptions('ram'), [itemDefinitions]);
  const processorOptions = useMemo(() => getDefOptions('processor'), [itemDefinitions]);
  const ssdOptions = useMemo(() => getDefOptions('ssd'), [itemDefinitions]);
  const generationOptions = useMemo(() => getDefOptions('generation'), [itemDefinitions]);
  const colourOptions = useMemo(() => getDefOptions('colour'), [itemDefinitions]);

  if (permLoading) return null;
  if (!hasPermission('item.create')) return null;

  const openDialog = () => {
    setForm(emptyForm());
    setErrors({});
    setOpen(true);
  };
  const closeDialog = () => { if (!saving) setOpen(false); };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const next = {};
    if (!String(form.name || '').trim()) next.name = 'Item name is required';
    if (!String(form.itemCode || '').trim()) next.itemCode = 'Item code is required';
    if (form.itemType === 'product' && !form.inventoryAccountId) next.inventoryAccountId = 'Inventory account is required for products';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
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
        costPrice: form.costPrice === '' || form.costPrice == null ? null : Number(form.costPrice),
        sellingPrice: form.sellingPrice === '' || form.sellingPrice == null ? null : Number(form.sellingPrice),
        taxPercentage: form.taxPercentage === '' || form.taxPercentage == null ? null : Number(form.taxPercentage),
        isInventoryTracked: form.itemType === 'service' ? false : form.isInventoryTracked,
        incomeAccountId: form.incomeAccountId || null,
        expenseAccountId: form.expenseAccountId || null,
        inventoryAccountId: form.itemType === 'service' ? null : (form.inventoryAccountId || null),
        isActive: form.isActive,
      };
      const result = await itemApi.create(payload);
      const created = result?.data || result;
      apiSuccess('Item created successfully.');
      setOpen(false);
      if (onCreated && created?.id) onCreated(created);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create item.';
      apiError(typeof msg === 'string' ? msg : 'Failed to create item.');
    } finally {
      setSaving(false);
    }
  };

  const freeSolo = (options, value, field) => (
    <Autocomplete
      freeSolo
      size="small"
      options={options}
      value={options.find((o) => o.value === value) || null}
      inputValue={value || ''}
      onInputChange={(_, v) => set(field, v)}
      onChange={(_, v) => set(field, v?.value || '')}
      renderInput={(params) => <TextField {...params} fullWidth />}
    />
  );

  return (
    <>
      <Tooltip title={tooltip || 'Quick Create Item'}>
        <span>
          <IconButton size={size} color="primary" onClick={openDialog} disabled={disabled} aria-label="Quick Create Item">
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={closeDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Autocomplete
                  size="small"
                  options={categoryOptions}
                  value={categoryOptions.find((c) => c.id === form.categoryId) || null}
                  onChange={(_, v) => set('categoryId', v?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
                  sx={{ flex: 1 }}
                />
                <QuickCreate
                  entityKey="itemCategory"
                  onCreated={(c) => {
                    dispatch(fetchItemCategories());
                    set('categoryId', c.id);
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Item Code" value={form.itemCode}
                onChange={(e) => set('itemCode', e.target.value)}
                error={!!errors.itemCode} helperText={errors.itemCode} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField size="small" label="Item Name" value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={!!errors.name} helperText={errors.name} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField size="small" label="Description" value={form.description}
                onChange={(e) => set('description', e.target.value)} multiline rows={2} fullWidth />
            </Grid>
            {[['Model', 'model', modelOptions], ['Size', 'size', sizeOptions], ['RAM', 'ram', ramOptions], ['Processor', 'processor', processorOptions]].map(([label, field, opts]) => (
              <Grid item xs={12} sm={6} md={3} key={field}>
                {freeSolo(opts, form[field], field)}
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Grid>
            ))}
            {[['SSD', 'ssd', ssdOptions], ['Generation', 'generation', generationOptions], ['Colour', 'colour', colourOptions]].map(([label, field, opts]) => (
              <Grid item xs={12} sm={6} md={3} key={field}>
                {freeSolo(opts, form[field], field)}
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={ITEM_TYPES}
                value={ITEM_TYPES.find((t) => t.value === form.itemType) || ITEM_TYPES[0]}
                onChange={(_, v) => {
                  const newType = v?.value || 'product';
                  setForm((prev) => ({ ...prev, itemType: newType, isInventoryTracked: newType === 'service' ? false : prev.isInventoryTracked }));
                }}
                getOptionLabel={(o) => o.label}
                renderInput={(params) => <TextField {...params} label="Item Type" fullWidth />}
                disableClearable
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={UOM_OPTIONS}
                value={UOM_OPTIONS.find((u) => u.value === form.unitOfMeasure) || UOM_OPTIONS[0]}
                onChange={(_, v) => set('unitOfMeasure', v?.value || 'Each')}
                getOptionLabel={(o) => o.label}
                renderInput={(params) => <TextField {...params} label="Unit of Measure" fullWidth />}
                disableClearable
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="Cost Price" type="number" value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="Selling Price" type="number" value={form.sellingPrice}
                onChange={(e) => set('sellingPrice', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">AED</InputAdornment> }} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="Tax Percentage" type="number" value={form.taxPercentage}
                onChange={(e) => set('taxPercentage', e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete size="small" options={accountOptions}
                value={accountOptions.find((a) => a.id === form.incomeAccountId) || null}
                onChange={(_, v) => set('incomeAccountId', v?.id || '')}
                renderInput={(params) => <TextField {...params} label="Income Account" fullWidth />}
                loading={accountsLoading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete size="small" options={accountOptions}
                value={accountOptions.find((a) => a.id === form.expenseAccountId) || null}
                onChange={(_, v) => set('expenseAccountId', v?.id || '')}
                renderInput={(params) => <TextField {...params} label="Expense Account" fullWidth />}
                loading={accountsLoading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete size="small" options={accountOptions}
                value={accountOptions.find((a) => a.id === form.inventoryAccountId) || null}
                onChange={(_, v) => set('inventoryAccountId', v?.id || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Inventory Account"
                    error={!!errors.inventoryAccountId}
                    helperText={errors.inventoryAccountId || (form.itemType === 'service' ? 'Optional for services' : 'Required for products')} fullWidth />
                )}
                loading={accountsLoading}
                disabled={form.itemType === 'service'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.isInventoryTracked} onChange={(e) => set('isInventoryTracked', e.target.checked)} disabled={form.itemType === 'service'} />}
                label="Track Inventory"
              />
              {form.itemType === 'service' && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>Inventory tracking is not available for services</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />} label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit" disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickCreateItem;
