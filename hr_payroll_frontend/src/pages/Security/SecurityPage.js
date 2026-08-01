import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, CircularProgress,
  InputAdornment, MenuItem, Avatar, Checkbox, FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Lock as LockIcon, LockOpen as UnlockIcon, VpnKey as ResetPwdIcon,
  Security as SecurityIcon, People as PeopleIcon, Shield as ShieldIcon,
  AdminPanelSettings as PermIcon,
} from '@mui/icons-material';
import { fetchUsers, createUser, updateUser, deleteUser, lockUser, unlockUser, resetUserPassword } from '../../store/slices/userSlice';
import hrApi from '../../services/hrApi';
import { showSuccess, showError } from '../../utils/toast';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' }, { value: 'company_admin', label: 'Company Admin' },
  { value: 'hr_manager', label: 'HR Manager' }, { value: 'payroll_manager', label: 'Payroll Manager' },
  { value: 'hr_officer', label: 'HR Officer' }, { value: 'recruitment_officer', label: 'Recruitment Officer' },
  { value: 'employee', label: 'Employee' }, { value: 'read_only', label: 'Read Only' },
];
const ROLE_COLORS = { super_admin: 'error', company_admin: 'warning', hr_manager: 'primary', payroll_manager: 'info', hr_officer: 'secondary', employee: 'default', read_only: 'default' };

const SecurityPage = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('users');
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false); const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});
  const [resetPwdOpen, setResetPwdOpen] = useState(false); const [newPassword, setNewPassword] = useState('');

  // Roles state
  const [roles, setRoles] = useState([]); const [rolesLoading, setRolesLoading] = useState(false);
  const [permDialog, setPermDialog] = useState(false); const [permGroups, setPermGroups] = useState({});
  const [selectedRolePerms, setSelectedRolePerms] = useState([]);
  const [roleForm, setRoleForm] = useState({}); const [roleDialog, setRoleDialog] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState({}); const [permLoading, setPermLoading] = useState(false);

  const { list: allUsers = [], loading, pagination } = useSelector(s => s.users);
  const list = allUsers.filter(u => u.role !== 'super_admin');

  const loadUsers = useCallback(() => { dispatch(fetchUsers({ page: page + 1, limit: rowsPerPage, search: search || undefined })); }, [dispatch, page, rowsPerPage, search]);
  const loadRoles = useCallback(async () => { setRolesLoading(true); try { const r = await hrApi.get('/roles', { params: { limit: 100 } }); setRoles((r.data?.data || []).filter(role => role.code !== 'super_admin' && role.name !== 'Super Admin')); } catch(e){} finally { setRolesLoading(false); } }, []);
  const loadPermissions = useCallback(async () => { setPermLoading(true); try { const r = await hrApi.get('/permissions'); setPermissions(r.data?.data || {}); } catch(e){} finally { setPermLoading(false); } }, []);

  useEffect(() => { if (tabKey === 'users') loadUsers(); if (tabKey === 'roles') loadRoles(); if (tabKey === 'permissions') loadPermissions(); }, [tabKey, loadUsers, loadRoles, loadPermissions]);

  // ── Users ──
  const handleCreateUser = () => { setFormData({ role: 'employee' }); setEditMode(false); setDialogOpen(true); };
  const handleEditUser = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleUserSubmit = async () => {
    if (editMode) { const r = await dispatch(updateUser({ id: selectedId, data: formData })); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadUsers(); } else showError(r.payload); }
    else { const r = await dispatch(createUser(formData)); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadUsers(); } else showError(r.payload); }
  };
  const handleDeleteUser = async () => { const r = await dispatch(deleteUser(selectedId)); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Deleted'); setDeleteOpen(false); loadUsers(); } else showError(r.payload); };
  const handleLock = async (id) => { await dispatch(lockUser(id)); showSuccess('Locked'); loadUsers(); };
  const handleUnlock = async (id) => { await dispatch(unlockUser(id)); showSuccess('Unlocked'); loadUsers(); };
  const handleResetPwd = async () => {
    if (!newPassword || newPassword.length < 8) { showError('Min 8 characters'); return; }
    const r = await dispatch(resetUserPassword({ id: selectedId, password: newPassword }));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Reset'); setResetPwdOpen(false); setNewPassword(''); } else showError(r.payload);
  };

  // ── Roles ──
  const handleCreateRole = () => { setRoleForm({}); setRoleDialog(true); };
  const handleEditRole = (r) => { setRoleForm({ id: r.id, name: r.name, code: r.code, description: r.description }); setRoleDialog(true); };
  const handleRoleSubmit = async () => {
    try {
      if (roleForm.id) { await hrApi.put(`/roles/${roleForm.id}`, roleForm); showSuccess('Updated'); }
      else { await hrApi.post('/roles', roleForm); showSuccess('Created'); }
      setRoleDialog(false); loadRoles();
    } catch(e) { showError(e.response?.data?.message || 'Failed'); }
  };
  const handleDeleteRole = async (id) => { try { await hrApi.delete(`/roles/${id}`); showSuccess('Deleted'); loadRoles(); } catch(e) { showError(e.response?.data?.message || 'Failed'); } };
  const handleManagePerms = async (role) => {
    setPermDialog(true); setSelectedId(role.id);
    try {
      const r = await hrApi.get(`/roles/${role.id}`);
      setSelectedRolePerms((r.data?.data?.permissions || []).map(p => p.id));
      const pr = await hrApi.get('/permissions'); setPermGroups(pr.data?.data || {});
    } catch(e) {}
  };
  const handlePermToggle = (pid) => { setSelectedRolePerms(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]); };
  const handlePermSave = async () => { try { await hrApi.post(`/roles/${selectedId}/permissions`, { permissionIds: selectedRolePerms }); showSuccess('Permissions updated'); setPermDialog(false); loadRoles(); } catch(e) { showError('Failed'); } };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Security & Access Control</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Manage users, roles, permissions, and security policies</Typography>

      <Tabs value={tabKey} onChange={(e, v) => { setTabKey(v); setPage(0); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<PeopleIcon />} iconPosition="start" label="Users" value="users" />
        <Tab icon={<ShieldIcon />} iconPosition="start" label="Roles" value="roles" />
        <Tab icon={<PermIcon />} iconPosition="start" label="Permissions" value="permissions" />
      </Tabs>

      {/* ── USERS ── */}
      {tabKey === 'users' && (<>
        <Card sx={{ mb: 2 }}><CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}><TextField fullWidth size="small" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} /></Grid>
            <Grid item xs={6} md={2}><Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadUsers}>Refresh</Button></Grid>
            <Grid item xs={6} md={2}><Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreateUser}>Add User</Button></Grid>
          </Grid>
        </CardContent></Card>
        <Card>{loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <><TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ fontWeight: 600 }}>User</TableCell><TableCell sx={{ fontWeight: 600 }}>Email</TableCell><TableCell sx={{ fontWeight: 600 }}>Role</TableCell><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
          </TableRow></TableHead><TableBody>
            {list.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No users found</Typography></TableCell></TableRow>
              : list.map(user => (<TableRow key={user.id} hover>
                <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 14 }}>{user.firstName?.[0]}{user.lastName?.[0]}</Avatar><Box><Typography variant="body2" fontWeight={600}>{user.firstName} {user.lastName}</Typography><Typography variant="caption" color="text.secondary">@{user.username}</Typography></Box></Box></TableCell>
                <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
                <TableCell><Chip label={ROLES.find(r => r.value === user.role)?.label || user.role} size="small" color={ROLE_COLORS[user.role] || 'default'} /></TableCell>
                <TableCell>{user.isLocked ? <Chip label="Locked" size="small" color="error" /> : user.isActive ? <Chip label="Active" size="small" color="success" /> : <Chip label="Inactive" size="small" color="default" />}</TableCell>
                <TableCell><Typography variant="caption">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</Typography></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEditUser(user)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  {user.isLocked ? <Tooltip title="Unlock"><IconButton size="small" color="success" onClick={() => handleUnlock(user.id)}><LockOpenIcon fontSize="small" /></IconButton></Tooltip> : <Tooltip title="Lock"><IconButton size="small" color="warning" onClick={() => handleLock(user.id)}><LockIcon fontSize="small" /></IconButton></Tooltip>}
                  <Tooltip title="Reset Password"><IconButton size="small" onClick={() => { setSelectedId(user.id); setResetPwdOpen(true); setNewPassword(''); }}><ResetPwdIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { setSelectedId(user.id); setDeleteOpen(true); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>))}
          </TableBody></Table></TableContainer>
          <TablePagination component="div" count={pagination.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} /></>
        )}</Card>
      </>)}

      {/* ── ROLES ── */}
      {tabKey === 'roles' && (<>
        <Card sx={{ mb: 2 }}><CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}><TextField fullWidth size="small" placeholder="Search roles..." InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} /></Grid>
            <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreateRole}>Add Role</Button></Grid>
          </Grid>
        </CardContent></Card>
        <Card>{rolesLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell><TableCell sx={{ fontWeight: 600 }}>Code</TableCell><TableCell sx={{ fontWeight: 600 }}>Type</TableCell><TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
          </TableRow></TableHead><TableBody>
            {roles.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No roles</Typography></TableCell></TableRow>
              : roles.map(r => (<TableRow key={r.id} hover>
                <TableCell><Typography variant="body2" fontWeight={600}>{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.description}</Typography></TableCell>
                <TableCell><Chip label={r.code} size="small" variant="outlined" /></TableCell>
                <TableCell>{r.isSystem ? <Chip label="System" size="small" color="info" /> : <Chip label="Custom" size="small" />}</TableCell>
                <TableCell><Typography variant="caption">{r.permissions?.length || 0} assigned</Typography></TableCell>
                <TableCell align="right">
                  <Tooltip title="Manage Permissions"><IconButton size="small" color="secondary" onClick={() => handleManagePerms(r)}><PermIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEditRole(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  {!r.isSystem && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteRole(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                </TableCell>
              </TableRow>))}
          </TableBody></Table></TableContainer>
        )}</Card>
      </>)}

      {/* ── PERMISSIONS ── */}
      {tabKey === 'permissions' && (<>
        <Card>{permLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <TableContainer>
            {Object.entries(permissions).map(([group, perms]) => (
              <Box key={group} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'action.hover', fontWeight: 600 }}>{group}</Typography>
                <Table size="small"><TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell><TableCell sx={{ fontWeight: 600 }}>Name</TableCell><TableCell sx={{ fontWeight: 600 }}>Module</TableCell><TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow></TableHead><TableBody>
                  {perms.map(p => (<TableRow key={p.id} hover>
                    <TableCell><Chip label={p.code} size="small" variant="outlined" /></TableCell>
                    <TableCell>{p.name}</TableCell><TableCell><Chip label={p.module} size="small" /></TableCell><TableCell><Chip label={p.action} size="small" color="primary" variant="outlined" /></TableCell>
                  </TableRow>))}
                </TableBody></Table>
              </Box>
            ))}
          </TableContainer>
        )}</Card>
      </>)}

      {/* ── Permission Matrix Dialog ── */}
      <Dialog open={permDialog} onClose={() => setPermDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Role Permissions
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" color="primary" onClick={() => {
              const allIds = Object.values(permGroups).flat().map(p => p.id);
              setSelectedRolePerms(allIds);
            }}>Select All</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => setSelectedRolePerms([])}>Unselect All</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {Object.entries(permGroups).map(([group, perms]) => (
            <Box key={group} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{group}</Typography>
              <Grid container spacing={1}>
                {perms.map(p => (
                  <Grid item xs={6} sm={4} md={3} key={p.id}>
                    <FormControlLabel control={<Checkbox size="small" checked={selectedRolePerms.includes(p.id)} onChange={() => handlePermToggle(p.id)} />} label={<Typography variant="caption">{p.name}</Typography>} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setPermDialog(false)}>Cancel</Button><Button variant="contained" onClick={handlePermSave}>Save Permissions</Button></DialogActions>
      </Dialog>

      {/* ── User Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField fullWidth size="small" label="First Name *" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Last Name *" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Email *" type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Username" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Phone" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></Grid>
          {!editMode && <Grid item xs={12}><TextField fullWidth size="small" label="Password *" type="password" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} required helperText="Min 8 characters" /></Grid>}
          <Grid item xs={12}><TextField select fullWidth size="small" label="Role *" value={formData.role || 'employee'} onChange={e => setFormData({ ...formData, role: e.target.value })} required>{ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12}><TextField select fullWidth size="small" label="Status" value={formData.isActive === false ? 'inactive' : 'active'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></TextField></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleUserSubmit}>{editMode ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      {/* ── Role Dialog ── */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{roleForm.id ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent dividers><Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={roleForm.name || ''} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} required /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={roleForm.code || ''} onChange={e => setRoleForm({ ...roleForm, code: e.target.value })} required /></Grid>
          <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={roleForm.description || ''} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setRoleDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleRoleSubmit}>{roleForm.id ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      {/* ── Delete / Reset Pwd ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Are you sure?</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" variant="contained" onClick={handleDeleteUser}>Delete</Button></DialogActions></Dialog>
      <Dialog open={resetPwdOpen} onClose={() => setResetPwdOpen(false)} maxWidth="xs" fullWidth><DialogTitle>Reset Password</DialogTitle><DialogContent><TextField fullWidth size="small" label="New Password *" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={{ mt: 1 }} helperText="Min 8 characters" /></DialogContent><DialogActions><Button onClick={() => setResetPwdOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleResetPwd}>Reset</Button></DialogActions></Dialog>
    </Box>
  );
};

export default SecurityPage;
