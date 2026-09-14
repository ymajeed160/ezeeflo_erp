import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, MenuItem, TextField, Tooltip, Autocomplete,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import accountApi from '../../services/accountApi';
import usePermissions from '../../hooks/usePermissions';
import { apiError, apiSuccess } from '../../utils/toast';

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
];

const rand = (len = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const emptyForm = () => ({ name: '', type: '', parentAccountId: '', description: '' });

/**
 * Full "Quick Create Account" modal. Used by the QuickCreate component when
 * entityKey === 'account'. Includes a searchable Parent Account dropdown so the
 * new account can be linked as a sub-account.
 */
const QuickCreateAccount = ({ onCreated, disabled = false, size = 'small', tooltip }) => {
  const { hasPermission, loading: permLoading } = usePermissions();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const res = await accountApi.getAll({ limit: 500, isActive: 'all' });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (mounted) setAccounts(list);
      } catch {
        if (mounted) setAccounts([]);
      } finally {
        if (mounted) setAccountsLoading(false);
      }
    };
    loadAccounts();
    return () => { mounted = false; };
  }, [open]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ id: a.id, label: `${a.code} - ${a.name}` })),
    [accounts]
  );

  if (permLoading) return null;
  if (!hasPermission('chart-of-accounts.create')) return null;

  const openDialog = () => {
    setForm(emptyForm());
    setErrors({});
    setOpen(true);
  };
  const closeDialog = () => { if (!saving) setOpen(false); };
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const next = {};
    if (!String(form.name || '').trim()) next.name = 'Account name is required';
    if (!form.type) next.type = 'Account type is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        code: `ACC-${rand()}`,
        name: form.name.trim(),
        type: form.type,
        parentAccountId: form.parentAccountId || null,
        description: form.description?.trim() || null,
      };
      const result = await accountApi.create(payload);
      const created = result?.data || result;
      apiSuccess('Account created successfully.');
      setOpen(false);
      if (onCreated && created?.id) onCreated(created);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create account.';
      apiError(typeof msg === 'string' ? msg : 'Failed to create account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title={tooltip || 'Quick Create Account'}>
        <span>
          <IconButton size={size} color="primary" onClick={openDialog} disabled={disabled} aria-label="Quick Create Account">
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Create Account</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField
              label="Account Name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
              autoFocus
            />
            <TextField
              select
              label="Account Type"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              error={!!errors.type}
              helperText={errors.type}
              required
              fullWidth
            >
              {ACCOUNT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            <Autocomplete
              options={accountOptions}
              value={accountOptions.find((a) => a.id === form.parentAccountId) || null}
              onChange={(_, v) => set('parentAccountId', v?.id || '')}
              getOptionLabel={(o) => o.label || ''}
              renderInput={(params) => (
                <TextField {...params} label="Parent Account (optional)" fullWidth />
              )}
              loading={accountsLoading}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit" disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickCreateAccount;
