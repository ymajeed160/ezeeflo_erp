import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Switch, FormControlLabel, Alert, CircularProgress, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Block, CheckCircle } from '@mui/icons-material';
import { fetchUsers, createUser, updateUser, deleteUser, toggleUserStatus, clearError } from '../store/slices/userSlice';
import { fetchRoles } from '../store/slices/roleSlice';

const Users = () => {
  const dispatch = useDispatch();
  const { items: users, loading, error } = useSelector((state) => state.users);
  const roles = useSelector((state) => state.roles?.items || []);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', roleId: '', isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleOpen = (user = null) => {
    if (user) {
      setEditItem(user);
      setForm({
        firstName: user.firstName, lastName: user.lastName, email: user.email,
        password: '', phone: user.phone || '', roleId: (user.roles || user.Roles)?.[0]?.id || '',
        isActive: user.isActive,
      });
    } else {
      setEditItem(null);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', roleId: '', isActive: true });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditItem(null); };

  const validate = () => {
    const errors = {};
    if (!form.firstName) errors.firstName = 'Required';
    if (!form.lastName) errors.lastName = 'Required';
    if (!form.email) errors.email = 'Required';
    if (!editItem && !form.password) errors.password = 'Required';
    if (!form.roleId) errors.roleId = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const { roleId, password, ...rest } = form;
    const payload = { ...rest, roleIds: [roleId] };
    // Only include password when it has a value (for new users or password change)
    if (password) {
      payload.password = password;
    }
    if (editItem) {
      dispatch(updateUser({ id: editItem.id, data: payload }));
    } else {
      dispatch(createUser(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(id));
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleUserStatus(id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage system users</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => dispatch(clearError())}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 2 }} /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No users found</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.85rem' }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      <Typography fontWeight={500}>{user.firstName} {user.lastName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {(user.roles || user.Roles)?.map((r) => (
                      <Chip key={r.id} label={r.name} size="small" color="primary" variant="outlined" />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.isActive ? <CheckCircle /> : <Block />}
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Toggle Status">
                      <IconButton onClick={() => handleToggleStatus(user.id)} size="small">
                        {user.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpen(user)} size="small"><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(user.id)} size="small" color="error"><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={!!formErrors.firstName} helperText={formErrors.firstName} />
              <TextField label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={!!formErrors.lastName} helperText={formErrors.lastName} />
            </Box>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={!!formErrors.email} helperText={formErrors.email} disabled={!!editItem} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {!editItem && (
              <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={!!formErrors.password} helperText={formErrors.password || 'Min 8 chars, uppercase, lowercase & number'} />
            )}
            <TextField select label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} error={!!formErrors.roleId} helperText={formErrors.roleId}>
              {roles.map((r) => (<MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>))}
            </TextField>
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;