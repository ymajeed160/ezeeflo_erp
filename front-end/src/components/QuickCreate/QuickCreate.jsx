import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { QUICK_CREATE_ENTITIES } from '../../quickCreate/quickCreateEntities';
import usePermissions from '../../hooks/usePermissions';
import { apiError, apiSuccess } from '../../utils/toast';
import QuickCreateItem from './QuickCreateItem';
import QuickCreateAccount from './QuickCreateAccount';

const emptyValues = (fields) =>
  fields.reduce((acc, f) => {
    acc[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
    return acc;
  }, {});

/**
 * Reusable Global Quick Create control.
 *
 * Renders a small [+] button next to a master-data dropdown. Clicking it opens
 * a lightweight modal that creates the record via the existing create API —
 * without leaving the current transaction page.
 *
 * Props:
 *  - entityKey : key into QUICK_CREATE_ENTITIES ('supplier' | 'customer' | ...)
 *  - onCreated : (createdEntity) => void — called after a successful create so
 *                the parent can refresh its dropdown and auto-select the record.
 *  - disabled  : optional; disables the button (e.g. while saving the parent form)
 *  - size      : MUI IconButton size
 *  - tooltip   : override tooltip text (defaults to "Quick Create {label}")
 */
const QuickCreate = ({ entityKey, onCreated, disabled = false, size = 'small', tooltip }) => {
  const config = QUICK_CREATE_ENTITIES[entityKey];
  const { hasPermission, loading: permLoading } = usePermissions();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!config) return null;
  if (permLoading) return null;
  if (!hasPermission(config.permission)) return null; // RBAC gate

  // Item uses the full "Add New Item" form
  if (entityKey === 'item') {
    return <QuickCreateItem onCreated={onCreated} disabled={disabled} size={size} tooltip={tooltip} />;
  }

  // Account uses the full "Quick Create Account" form (with Parent Account)
  if (entityKey === 'account') {
    return <QuickCreateAccount onCreated={onCreated} disabled={disabled} size={size} tooltip={tooltip} />;
  }

  const openDialog = () => {
    setValues(emptyValues(config.fields));
    setErrors({});
    setOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setOpen(false);
  };

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field.name]: e.target.value }));
    if (errors[field.name]) {
      setErrors((prev) => ({ ...prev, [field.name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    config.fields.forEach((f) => {
      if (f.required && !String(values[f.name] ?? '').trim()) {
        next[f.name] = `${f.label} is required`;
      }
      if (f.type === 'email' && values[f.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.name])) {
        next[f.name] = 'Enter a valid email address';
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = config.buildPayload(values);
      const result = await config.api.create(payload);
      const created = result?.data || result; // create APIs resolve to { success, data: entity }
      const id = created?.id;
      apiSuccess(`${config.label} created successfully.`);
      setOpen(false);
      if (onCreated && id) onCreated(created);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        `Failed to create ${config.label}.`;
      apiError(typeof msg === 'string' ? msg : `Failed to create ${config.label}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title={tooltip || `Quick Create ${config.label}`}>
        <span>
          <IconButton
            size={size}
            color="primary"
            onClick={openDialog}
            disabled={disabled}
            aria-label={`Quick Create ${config.label}`}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Quick Create {config.label}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {config.fields.map((field) => (
              <TextField
                key={field.name}
                label={field.label}
                value={values[field.name] ?? ''}
                onChange={handleChange(field)}
                fullWidth
                size="small"
                required={field.required}
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                select={field.type === 'select'}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                autoFocus={field.name === config.fields[0]?.name}
              >
                {field.type === 'select' &&
                  (field.options || []).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
              </TextField>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickCreate;
