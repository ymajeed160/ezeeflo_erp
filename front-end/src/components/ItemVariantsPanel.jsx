import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, TextField, Select,
  MenuItem, FormControl, InputLabel, IconButton, Tooltip, Grid, Alert,
} from '@mui/material';
import { Add, Block, CheckCircle, Refresh, Delete } from '@mui/icons-material';
import itemVariantApi from '../services/itemVariantApi';
import { apiSuccess, apiError } from '../utils/toast';

/**
 * ItemVariantsPanel
 * Lists and creates variants for a variant-enabled parent item.
 */
const ItemVariantsPanel = ({ itemId, item }) => {
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attrRes, varRes] = await Promise.all([
        itemVariantApi.getApplicableAttributes(itemId),
        itemVariantApi.listByItem(itemId, { limit: 100 }),
      ]);
      setAttributes(attrRes.data?.attributes || []);
      setVariants(varRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (itemId) load();
  }, [itemId, load]);

  const handleToggle = async (variant) => {
    try {
      await itemVariantApi.toggleStatus(variant.id);
      apiSuccess('Variant status updated');
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to update variant');
    }
  };

  const handleDelete = async (variant) => {
    if (!window.confirm(`Delete variant ${variant.sku}?`)) return;
    try {
      await itemVariantApi.delete(variant.id);
      apiSuccess('Variant deleted');
      load();
    } catch (err) {
      apiError(err?.response?.data?.message || 'Failed to delete variant');
    }
  };

  const handleCreate = async () => {
    // Build attributeValues array from the form state.
    const attributeValues = [];
    for (const attr of attributes) {
      const v = config[attr.attributeId];
      if (v !== undefined && v !== null && v !== '') {
        if (attr.dataType === 'dropdown') {
          attributeValues.push({ attributeId: attr.attributeId, optionId: v });
        } else {
          attributeValues.push({ attributeId: attr.attributeId, value: v });
        }
      }
    }
    setSaving(true);
    setError(null);
    try {
      const res = await itemVariantApi.resolve(itemId, { attributeValues });
      apiSuccess(res.message || 'Variant created');
      setConfig({});
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create variant');
      apiError(err?.response?.data?.message || 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  };

  const displayOf = (variant) => {
    const vals = (variant.attributeValues || [])
      .map(av => av.displayValue || av.value)
      .filter(Boolean);
    return vals.join(' · ');
  };

  if (!item?.isVariantEnabled) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Variants are not enabled for this item. Enable "Supports Variants" on the
        item and assign an attribute template to configure variations.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>Variants</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton size="small" onClick={load}><Refresh fontSize="small" /></IconButton></Tooltip>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setShowCreate(!showCreate)}>
            New Variant
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}

      {showCreate && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Configure a new variant — identical configurations reuse the existing SKU.</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {attributes.map((attr) => (
              <Grid item xs={12} sm={6} md={4} key={attr.attributeId}>
                {attr.dataType === 'dropdown' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>{attr.name}{attr.isRequired ? ' *' : ''}</InputLabel>
                    <Select
                      label={`${attr.name}${attr.isRequired ? ' *' : ''}`}
                      value={config[attr.attributeId] || ''}
                      onChange={(e) => setConfig((c) => ({ ...c, [attr.attributeId]: e.target.value }))}
                    >
                      {attr.options.map((o) => (
                        <MenuItem key={o.optionId} value={o.optionId}>{o.value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label={`${attr.name}${attr.isRequired ? ' *' : ''}`}
                    type={attr.dataType === 'number' ? 'number' : 'text'}
                    value={config[attr.attributeId] || ''}
                    onChange={(e) => setConfig((c) => ({ ...c, [attr.attributeId]: e.target.value }))}
                  />
                )}
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button size="small" variant="contained" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create / Resolve Variant'}
            </Button>
            <Button size="small" onClick={() => setShowCreate(false)}>Cancel</Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <CircularProgress size={24} sx={{ my: 2 }} />
      ) : variants.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          No variants yet. Create the first configuration.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{v.sku}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{v.description || displayOf(v)}</Typography>
                    {displayOf(v) && (
                      <Typography variant="caption" color="text.secondary">{displayOf(v)}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={v.isActive ? <CheckCircle /> : <Block />}
                      label={v.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={v.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={v.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small" onClick={() => handleToggle(v)}>
                        {v.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(v)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ItemVariantsPanel;
