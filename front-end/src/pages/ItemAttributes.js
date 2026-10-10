import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  Alert, CircularProgress, Tooltip, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Block, CheckCircle, Refresh, Search, Remove } from '@mui/icons-material';
import itemAttributeApi from '../services/itemAttributeApi';
import { apiSuccess, apiError } from '../utils/toast';

const DATA_TYPES = [
  { value: 'dropdown', label: 'Dropdown (select from options)' },
  { value: 'text', label: 'Free text' },
  { value: 'number', label: 'Number' },
];

const ItemAttributes = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', dataType: 'dropdown',
    isVariantDefining: true, isRequired: false, isActive: true,
    options: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [optionInput, setOptionInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemAttributeApi.getAll({ limit: 200 });
      setAttributes(res.data || res.rows || []);
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to load attributes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (attr = null) => {
    if (attr) {
      setEditItem(attr);
      setForm({
        name: attr.name || '',
        code: attr.code || '',
        dataType: attr.dataType || 'dropdown',
        isVariantDefining: attr.isVariantDefining !== false,
        isRequired: attr.isRequired === true,
        isActive: attr.isActive !== false,
        options: (attr.options || []).map(o => o.value),
      });
    } else {
      setEditItem(null);
      setForm({
        name: '', code: '', dataType: 'dropdown',
        isVariantDefining: true, isRequired: false, isActive: true, options: [],
      });
    }
    setFormErrors({});
    setOptionInput('');
    setOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Attribute name is required';
    if (form.dataType === 'dropdown' && form.options.length === 0) {
      errors.options = 'Add at least one option for a dropdown attribute';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        dataType: form.dataType,
        isVariantDefining: form.isVariantDefining,
        isRequired: form.isRequired,
        isActive: form.isActive,
        options: form.dataType === 'dropdown' ? form.options : undefined,
      };
      if (editItem) {
        await itemAttributeApi.update(editItem.id, payload);
        apiSuccess('Attribute updated');
      } else {
        await itemAttributeApi.create(payload);
        apiSuccess('Attribute created');
      }
      setOpen(false);
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to save attribute');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (attr) => {
    if (!window.confirm(`Delete attribute "${attr.name}"?`)) return;
    try {
      await itemAttributeApi.delete(attr.id);
      apiSuccess('Attribute deleted');
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const filtered = attributes.filter(a =>
    !search ||
    (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Attributes</Typography>
          <Typography variant="body2" color="text.secondary">Define reusable product attributes (e.g. Model, Colour, RAM)</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>
          Add Attribute
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search attributes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ minWidth: 300 }}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Options</strong></TableCell>
                <TableCell><strong>Variant Defining</strong></TableCell>
                <TableCell><strong>Required</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No attributes yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{a.name}</TableCell>
                  <TableCell><Chip label={a.code} size="small" variant="outlined" /></TableCell>
                  <TableCell>{a.dataType}</TableCell>
                  <TableCell>
                    {(a.options || []).map(o => (
                      <Chip key={o.id} label={o.value} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                    {a.dataType !== 'dropdown' && '-'}
                  </TableCell>
                  <TableCell>{a.isVariantDefining ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{a.isRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={a.isActive ? <CheckCircle /> : <Block />}
                      label={a.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={a.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(a)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(a)}><Delete fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              placeholder="e.g. Colour"
            />
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              helperText="Optional — auto-generated from name if left blank"
              fullWidth
            />
            <TextField
              select
              label="Data Type"
              value={form.dataType}
              onChange={(e) => setForm({ ...form, dataType: e.target.value })}
              fullWidth
            >
              {DATA_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>

            {form.dataType === 'dropdown' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Options</Typography>
                {formErrors.options && <Alert severity="error" sx={{ mb: 1 }}>{formErrors.options}</Alert>}
                {form.options.map((opt, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={opt}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = e.target.value;
                        setForm({ ...form, options: next });
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setForm({ ...form, options: form.options.filter((_, i) => i !== idx) })}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="New option value (e.g. Red)"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = optionInput.trim();
                        if (v && !form.options.includes(v)) {
                          setForm({ ...form, options: [...form.options, v] });
                          setOptionInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const v = optionInput.trim();
                      if (v && !form.options.includes(v)) {
                        setForm({ ...form, options: [...form.options, v] });
                        setOptionInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            )}

            <FormControlLabel
              control={<Switch checked={form.isVariantDefining} onChange={(e) => setForm({ ...form, isVariantDefining: e.target.checked })} />}
              label="Variant defining (distinguishes stock variants)"
            />
            <FormControlLabel
              control={<Switch checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />}
              label="Required"
            />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemAttributes;
