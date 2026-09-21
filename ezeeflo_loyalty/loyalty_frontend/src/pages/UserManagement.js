import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, IconButton, Menu, MenuItem,
  Switch, FormControlLabel, Autocomplete,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Refresh, Search } from '@mui/icons-material';
import { userApi, roleApi } from '../services/rbacApi';
import { showSuccess, showError } from '../utils/toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', isActive: true, roleIds: [] });
  const [saving, setSaving] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, roleRes] = await Promise.all([
        userApi.getAll({ page: page + 1, limit: 20, search }),
        roleApi.getAll({ limit: 100 }),
      ]);
      setUsers(userRes.data.data || []);
      setRoles(roleRes.data.data || []);
      setTotalPages(userRes.data.meta?.pagination?.totalPages || 1);
    } catch {} finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', isActive: true, roleIds: [] });
    setDialog({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setForm({
      username: user.username || '', email: user.email || '', password: '',
      firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '',
      isActive: user.isActive, roleIds: (user.roles || []).map(r => r.id),
    });
    setDialog({ open: true, mode: 'edit', user });
  };

  const handleSave = async () => {
    if (!form.username || !form.email) { showError('Username and email are required'); return; }
    if (dialog.mode === 'create' && !form.password) { showError('Password is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (dialog.mode === 'edit' && !payload.password) delete payload.password;
      if (dialog.mode === 'create') {
        await userApi.create(payload);
        showSuccess('User created');
      } else {
        await userApi.update(dialog.user.id, payload);
        showSuccess('User updated');
      }
      setDialog({ open: false, mode: 'create', user: null });
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userApi.toggleStatus(user.id);
      showSuccess(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await userApi.delete(user.id);
      showSuccess('User deleted');
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading && users.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Users & Roles</Typography>
          <Typography variant="body2" color="text.secondary">Manage users, roles, and permissions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add User</Button>
        </Box>
      </Box>

      <TextField placeholder="Search users..." size="small" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ mb: 2, width: 300 }} />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Username</TableCell>
              <TableCell>Roles</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>
                  {(u.roles || []).map(r => <Chip key={r.id} label={r.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </TableCell>
                <TableCell>
                  <Switch checked={u.isActive} size="small" onChange={() => handleToggleStatus(u)} />
                  <Typography variant="caption">{u.isActive ? 'Active' : 'Inactive'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(u)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No users found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {page + 1} of {totalPages}</Typography>
          <Button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Username *" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="password" label={dialog.mode === 'create' ? 'Password *' : 'Password (leave blank to keep)'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple size="small"
                options={roles}
                getOptionLabel={(opt) => opt.name}
                value={roles.filter(r => form.roleIds.includes(r.id))}
                onChange={(e, newVal) => setForm({ ...form, roleIds: newVal.map(r => r.id) })}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => <TextField {...params} label="Roles" />}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create', user: null })}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
