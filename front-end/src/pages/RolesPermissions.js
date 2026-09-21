import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Checkbox, FormGroup,
  FormControlLabel, Card, CardHeader, CardContent, Stack, Alert, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { fetchRoles, createRole, updateRole, deleteRole, clearError } from '../store/slices/roleSlice';
import { fetchPermissions, fetchPermissionModules } from '../store/slices/permissionSlice';

const RolesPermissions = () => {
  const dispatch = useDispatch();
  const { items: roles, loading, error } = useSelector((state) => state.roles);
  const { items: permissions, modules } = useSelector((state) => state.permissions);

  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
    dispatch(fetchPermissionModules());
  }, [dispatch]);

  const handleOpen = (role = null) => {
    if (role) {
      setEditRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description || '');
      setSelectedPermissions((role.permissions || role.Permissions)?.map((p) => p.id) || []);
    } else {
      setEditRole(null);
      setRoleName('');
      setRoleDesc('');
      setSelectedPermissions([]);
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditRole(null); };

  const handleTogglePerm = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = () => {
    if (!roleName.trim()) {
      setFormErrors({ name: 'Role name is required' });
      return;
    }
    const payload = { name: roleName, description: roleDesc, permissionIds: selectedPermissions };
    if (editRole) {
      dispatch(updateRole({ id: editRole.id, data: payload }));
    } else {
      dispatch(createRole(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      dispatch(deleteRole(id));
    }
  };

  const getModulePermissions = (moduleName) => {
    return permissions.filter((p) => p.module === moduleName);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Roles & Permissions</Typography>
          <Typography variant="body2" color="text.secondary">Manage roles and their permissions</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Role
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Permissions</strong></TableCell>
              <TableCell><strong>Users</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress sx={{ my: 2 }} /></TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No roles found</TableCell></TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Chip label={role.name} color="primary" variant="filled" size="medium" />
                  </TableCell>
                  <TableCell>{role.description || '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(role.permissions || role.Permissions)?.slice(0, 4).map((p) => (
                        <Chip key={p.id} label={p.name} size="small" variant="outlined" />
                      ))}
                      {((role.permissions || role.Permissions)?.length || 0) > 4 && (
                        <Chip label={`+${(role.permissions || role.Permissions).length - 4}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{(role.users || role.Users)?.length || 0} users</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpen(role)} size="small"><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(role.id)} size="small" color="error"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
            />
            <TextField
              label="Description"
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setSelectedPermissions(permissions.map((p) => p.id))}>
                  Select All
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => setSelectedPermissions([])}>
                  Unselect All
                </Button>
              </Box>
            </Box>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {modules.map((moduleName) => {
                const modulePerms = getModulePermissions(moduleName);
                const allSelected = modulePerms.length > 0 && modulePerms.every((p) => selectedPermissions.includes(p.id));
                const someSelected = modulePerms.some((p) => selectedPermissions.includes(p.id));
                return (
                <Card key={moduleName} variant="outlined" sx={{ mb: 2 }}>
                  <CardHeader
                    title={moduleName}
                    titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                    action={
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={() => {
                              if (allSelected) {
                                setSelectedPermissions((prev) => prev.filter((id) => !modulePerms.some((p) => p.id === id)));
                              } else {
                                setSelectedPermissions((prev) => {
                                  const existing = new Set(prev);
                                  modulePerms.forEach((p) => existing.add(p.id));
                                  return [...existing];
                                });
                              }
                            }}
                            size="small"
                          />
                        }
                        label={allSelected ? 'Unselect All' : 'Select All'}
                        sx={{ mr: 1 }}
                      />
                    }
                    sx={{ py: 1, px: 2, bgcolor: 'action.hover' }}
                  />
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <FormGroup row>
                      {modulePerms.map((perm) => (
                        <FormControlLabel
                          key={perm.id}
                          control={
                            <Checkbox
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => handleTogglePerm(perm.id)}
                              size="small"
                            />
                          }
                          label={perm.name}
                          sx={{ minWidth: 200 }}
                        />
                      ))}
                    </FormGroup>
                  </CardContent>
                </Card>
                );
              })}
              {permissions.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No permissions available
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!roleName.trim()}>
            {editRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPermissions;