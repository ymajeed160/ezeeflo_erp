import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Alert, CircularProgress, Tooltip, Checkbox,
} from '@mui/material';
import { Add, Edit, Delete, Block, CheckCircle } from '@mui/icons-material';
import itemAttributeTemplateApi from '../services/itemAttributeTemplateApi';
import itemAttributeApi from '../services/itemAttributeApi';
import { apiSuccess, apiError } from '../utils/toast';

const ItemAttributeTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isActive: true, attributes: [] });
  const [formErrors, setFormErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, attrRes] = await Promise.all([
        itemAttributeTemplateApi.getAll({ limit: 200 }),
        itemAttributeApi.getAll({ limit: 200 }),
      ]);
      setTemplates(tplRes.data || tplRes.rows || []);
      setAllAttributes(attrRes.data || attrRes.rows || []);
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (tpl = null) => {
    if (tpl) {
      setEditItem(tpl);
      const existing = (tpl.templateAttributes || []).map((ta) => ({
        attributeId: ta.attributeId,
        isRequired: ta.isRequired === true,
        isVariantDefining: ta.isVariantDefining !== false,
      }));
      setForm({
        name: tpl.name || '',
        description: tpl.description || '',
        isActive: tpl.isActive !== false,
        attributes: existing,
      });
    } else {
      setEditItem(null);
      setForm({ name: '', description: '', isActive: true, attributes: [] });
    }
    setFormErrors({});
    setOpen(true);
  };

  const isSelected = (attributeId) => form.attributes.some((a) => a.attributeId === attributeId);
  const getSelected = (attributeId) => form.attributes.find((a) => a.attributeId === attributeId);

  const toggleAttribute = (attributeId) => {
    if (isSelected(attributeId)) {
      setForm({ ...form, attributes: form.attributes.filter((a) => a.attributeId !== attributeId) });
    } else {
      setForm({
        ...form,
        attributes: [...form.attributes, { attributeId, isRequired: false, isVariantDefining: true }],
      });
    }
  };

  const setFlag = (attributeId, key, value) => {
    setForm({
      ...form,
      attributes: form.attributes.map((a) =>
        a.attributeId === attributeId ? { ...a, [key]: value } : a
      ),
    });
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Template name is required';
    if (form.attributes.length === 0) errors.attributes = 'Select at least one attribute';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        isActive: form.isActive,
        attributes: form.attributes,
      };
      if (editItem) {
        await itemAttributeTemplateApi.update(editItem.id, payload);
        apiSuccess('Template updated');
      } else {
        await itemAttributeTemplateApi.create(payload);
        apiSuccess('Template created');
      }
      setOpen(false);
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await itemAttributeTemplateApi.delete(tpl.id);
      apiSuccess('Template deleted');
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to delete template');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Attribute Templates</Typography>
          <Typography variant="body2" color="text.secondary">Group attributes into reusable templates for variant items</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen(null)}>
          Add Template
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Attributes</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No templates yet. Create one to group attributes.</Typography>
                  </TableCell>
                </TableRow>
              ) : templates.map((tpl) => (
                <TableRow key={tpl.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{tpl.name}</TableCell>
                  <TableCell>{tpl.description || '-'}</TableCell>
                  <TableCell>
                    {(tpl.templateAttributes || []).map((ta) => (
                      <Chip
                        key={ta.id || ta.attributeId}
                        label={ta.attribute ? ta.attribute.name : ta.attributeId}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={tpl.isActive ? <CheckCircle /> : <Block />}
                      label={tpl.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={tpl.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(tpl)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(tpl)}><Delete fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Attribute Template' : 'Add Attribute Template'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              placeholder="e.g. Laptop"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attributes</Typography>
              {formErrors.attributes && <Alert severity="error" sx={{ mb: 1 }}>{formErrors.attributes}</Alert>}
              {allAttributes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No attributes defined yet. Create attributes first from Inventory → Attributes.
                </Typography>
              )}
              {allAttributes.map((attr) => {
                const selected = isSelected(attr.id);
                const current = getSelected(attr.id);
                return (
                  <Paper key={attr.id} variant="outlined" sx={{ p: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={selected}
                        onChange={() => toggleAttribute(attr.id)}
                        size="small"
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{attr.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attr.dataType} · {attr.isVariantDefining ? 'variant defining' : 'informational'}
                        </Typography>
                      </Box>
                      {selected && (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={current.isRequired}
                                onChange={(e) => setFlag(attr.id, 'isRequired', e.target.checked)}
                              />
                            }
                            label="Required"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={current.isVariantDefining}
                                onChange={(e) => setFlag(attr.id, 'isVariantDefining', e.target.checked)}
                              />
                            }
                            label="Variant"
                          />
                        </>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
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

export default ItemAttributeTemplates;
