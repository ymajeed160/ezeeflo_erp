import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, IconButton, Switch, Checkbox,
  FormControlLabel, Card, CardContent, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Security, Close } from '@mui/icons-material';
import { roleApi, permissionApi } from '../services/rbacApi';
import { showSuccess, showError } from '../utils/toast';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permGroups, setPermGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', role: null });
  const [permDialog, setPermDialog] = useState({ open: false, role: null, selectedPerms: [] });
  const [form, setForm] = useState({ name: '', code: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        roleApi.getAll({ limit: 100 }),
        permissionApi.getAll({ limit: 500 }),
      ]);
      setRoles(roleRes.data.data || []);
      const perms = permRes.data.data || [];
      setPermissions(perms);
      const groups = [...new Set(perms.map(p => p.module || p.groupName || 'General'))];
      setPermGroups(groups);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({ name: '', code: '', description: '', isActive: true });
    setDialog({ open: true, mode: 'create', role: null });
  };

  const openEdit = (role) => {
    setForm({ name: role.name, code: role.code, description: role.description || '', isActive: role.isActive });
    setDialog({ open: true, mode: 'edit', role });
  };

  const openPermissions = (role) => {
    const rolePermIds = (role.permissions || []).map(p => p.id);
    setPermDialog({ open: true, role, selectedPerms: rolePermIds });
  };

  const togglePerm = (permId) => {
    setPermDialog(prev => ({
      ...prev,
      selectedPerms: prev.selectedPerms.includes(permId)
        ? prev.selectedPerms.filter(id => id !== permId)
        : [...prev.selectedPerms, permId],
    }));
  };

  const toggleGroupPerms = (perms) => {
    const permIds = perms.map(p => p.id);
    const allSelected = permIds.every(id => permDialog.selectedPerms.includes(id));
    setPermDialog(prev => ({
      ...prev,
      selectedPerms: allSelected
        ? prev.selectedPerms.filter(id => !permIds.includes(id))
        : [...new Set([...prev.selectedPerms, ...permIds])],
    }));
  };

  const handleSavePerms = async () => {
    setSaving(true);
    try {
      await roleApi.assignPermissions(permDialog.role.id, permDialog.selectedPerms);
      showSuccess('Permissions updated');
      setPermDialog({ open: false, role: null, selectedPerms: [] });
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { showError('Name and code are required'); return; }
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await roleApi.create(form);
        showSuccess('Role created');
      } else {
        await roleApi.update(dialog.role.id, form);
        showSuccess('Role updated');
      }
      setDialog({ open: false, mode: 'create', role: null });
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (role) => {
    if (role.isSystem) { showError('System roles cannot be deleted'); return; }
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await roleApi.delete(role.id);
      showSuccess('Role deleted');
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Roles & Permissions</Typography>
          <Typography variant="body2" color="text.secondary">Define roles and assign granular permissions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Role</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {roles.map(role => (
          <Grid item xs={12} sm={6} md={4} key={role.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">{role.name}</Typography>
                    <Chip label={role.code} size="small" sx={{ mb: 1 }} />
                    {role.isSystem && <Chip label="System" size="small" color="warning" sx={{ ml: 0.5 }} />}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openPermissions(role)} title="Manage Permissions">
                      <Security fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(role)} disabled={role.isSystem}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(role)} disabled={role.isSystem}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {role.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{role.description}</Typography>}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(role.permissions || []).slice(0, 5).map(p => (
                    <Chip key={p.id} label={p.name} size="small" variant="outlined" />
                  ))}
                  {(role.permissions || []).length > 5 && (
                    <Chip label={`+${role.permissions.length - 5} more`} size="small" variant="outlined" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {roles.length === 0 && (
          <Grid item xs={12}><Typography align="center" sx={{ py: 4 }} color="text.secondary">No roles defined yet</Typography></Grid>
        )}
      </Grid>

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', role: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Add Role' : 'Edit Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Role Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Code *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} helperText="e.g., admin, manager, cashier" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create', role: null })}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Permission Assignment Dialog */}
      <Dialog open={permDialog.open} onClose={() => setPermDialog({ open: false, role: null, selectedPerms: [] })} maxWidth="md" fullWidth>
        <DialogTitle>
          Permissions for: {permDialog.role?.name}
          <IconButton sx={{ float: 'right' }} onClick={() => setPermDialog({ open: false, role: null, selectedPerms: [] })}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {permGroups.map(group => {
            const groupPerms = permissions.filter(p => (p.module || p.groupName || 'General') === group);
            if (groupPerms.length === 0) return null;
            const groupSelected = groupPerms.every(p => permDialog.selectedPerms.includes(p.id));
            return (
              <Box key={group} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Checkbox checked={groupSelected} onChange={() => toggleGroupPerms(groupPerms)} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{group}</Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={1}>
                  {groupPerms.map(p => (
                    <Grid item xs={12} sm={6} md={4} key={p.id}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={permDialog.selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)} />}
                        label={<Typography variant="body2">{p.name} <Typography variant="caption" color="text.secondary">({p.code})</Typography></Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
          {permissions.length === 0 && <Typography color="text.secondary" sx={{ py: 2 }}>No permissions defined yet</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialog({ open: false, role: null, selectedPerms: [] })}>Cancel</Button>
          <Button onClick={handleSavePerms} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save Permissions'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
