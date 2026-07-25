import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Switch, FormControlLabel, Alert, CircularProgress, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';
import SuperAdminLayout from '../../components/Layout/SuperAdminLayout';
import {
  fetchModules, createModule, updateModule, deleteModule, clearError
} from '../../store/slices/subscriptionModuleSlice';

const statusOptions = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'beta', label: 'Beta' },
];

const SubscriptionModules = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: modules, loading, error } = useSelector((state) => state.subscriptionModules);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    moduleName: '', moduleCode: '', description: '',
    icon: '', route: '', status: 'enabled', sortOrder: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchModules());
  }, [dispatch]);

  const handleOpen = (mod = null) => {
    if (mod) {
      setEditItem(mod);
      setForm({
        moduleName: mod.moduleName || '',
        moduleCode: mod.moduleCode || '',
        description: mod.description || '',
        icon: mod.icon || '',
        route: mod.route || '',
        status: mod.status || 'enabled',
        sortOrder: mod.sortOrder ?? '',
      });
    } else {
      setEditItem(null);
      setForm({
        moduleName: '', moduleCode: '', description: '',
        icon: '', route: '', status: 'enabled', sortOrder: '',
      });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditItem(null); };

  const validate = () => {
    const errors = {};
    if (!form.moduleName) errors.moduleName = 'Required';
    if (!form.moduleCode) errors.moduleCode = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      ...form,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (editItem) {
      dispatch(updateModule({ id: editItem.id, data: payload }));
    } else {
      dispatch(createModule(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      dispatch(deleteModule(id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enabled': return 'success';
      case 'disabled': return 'default';
      case 'hidden': return 'warning';
      case 'beta': return 'info';
      default: return 'default';
    }
  };

  if (loading && modules.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SuperAdminLayout>
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Subscription Modules</Typography>
          <Typography variant="body2" color="text.secondary">
            Define the modules that can be assigned to subscription plans
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/superadmin')}>
            Dashboard
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Module
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => dispatch(clearError())}>
          {typeof error === 'string' ? error : error.message || 'An error occurred'}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sort Order</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No modules found. Create your first module!</Typography>
                </TableCell>
              </TableRow>
            ) : (
              modules.map((mod) => (
                <TableRow key={mod.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{mod.moduleName}</TableCell>
                  <TableCell><Chip label={mod.moduleCode} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={mod.route || '-'} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {mod.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={mod.status} color={getStatusColor(mod.status)} size="small" />
                  </TableCell>
                  <TableCell>{mod.sortOrder || 0}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(mod)}><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(mod.id)}><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Module' : 'Create New Module'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Module Name" value={form.moduleName}
              onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
              error={!!formErrors.moduleName} helperText={formErrors.moduleName} required
              placeholder="e.g., Accounting, Sales, Inventory" />
            <TextField fullWidth label="Module Code" value={form.moduleCode}
              onChange={(e) => setForm({ ...form, moduleCode: e.target.value })}
              error={!!formErrors.moduleCode} helperText={formErrors.moduleCode} required
              placeholder="e.g., accounting, sales, inventory" />
            <TextField fullWidth label="Description" value={form.description} multiline rows={2}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField fullWidth label="Icon" value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="e.g., AccountBalance, ShoppingCart" />
            <TextField fullWidth label="Route" value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              placeholder="e.g., /app/accounting" />
            <TextField fullWidth select label="Status" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statusOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Sort Order" type="number" value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </SuperAdminLayout>
  );
};

export default SubscriptionModules;
