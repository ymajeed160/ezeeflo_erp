import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Alert, Chip, Divider, Paper, List, ListItemButton,
  ListItemText,
} from '@mui/material';
import itemVariantApi from '../services/itemVariantApi';
import { apiError } from '../utils/toast';

/**
 * VariantSelectorDialog
 * Shown when a variant-enabled item is selected on a document line.
 * Lets the user either:
 *   a) pick an existing variant, or
 *   b) build a new configuration from the item's template attributes
 *      (which is resolved/reused server-side).
 */
const VariantSelectorDialog = ({ open, item, onClose, onConfirm }) => {
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({});

  const load = useCallback(async () => {
    if (!item?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [attrRes, varRes] = await Promise.all([
        itemVariantApi.getApplicableAttributes(item.id),
        itemVariantApi.listByItem(item.id, { limit: 100 }),
      ]);
      setAttributes(attrRes.data?.attributes || []);
      setVariants(varRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load variant attributes');
    } finally {
      setLoading(false);
    }
  }, [item?.id]);

  useEffect(() => {
    if (open && item?.id) {
      setConfig({});
      load();
    }
  }, [open, item?.id, load]);

  const handlePickExisting = (variant) => {
    onConfirm({
      id: variant.id,
      variantId: variant.id,
      sku: variant.sku,
      variantDescription: variant.description || variant.sku,
    });
  };

  const handleCreate = async () => {
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
      const res = await itemVariantApi.resolve(item.id, { attributeValues });
      const variant = res.data || {};
      onConfirm({
        id: variant.id,
        variantId: variant.id,
        sku: variant.sku,
        variantDescription: variant.description || variant.sku,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resolve variant';
      setError(msg);
      apiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const ordered = [...attributes].sort((a, b) => (a.displayOrder - b.displayOrder) || a.code.localeCompare(b.code));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Variant — {item?.name || ''}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {variants.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600}>Existing variants</Typography>
                <Paper variant="outlined">
                  <List dense>
                    {variants.map((v) => (
                      <ListItemButton key={v.id} onClick={() => handlePickExisting(v)}>
                        <ListItemText
                          primary={v.sku}
                          secondary={v.description}
                        />
                        {v.isActive === false && <Chip label="Inactive" size="small" color="error" />}
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
                <Divider />
              </>
            )}

            <Typography variant="subtitle2" fontWeight={600}>New configuration</Typography>
            {attributes.length === 0 && (
              <Alert severity="info">No attributes are configured for this item.</Alert>
            )}
            {ordered.map((attr) => (
              <Box key={attr.attributeId}>
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
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Create / Resolve Variant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantSelectorDialog;
