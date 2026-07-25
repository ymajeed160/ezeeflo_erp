import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Alert, CircularProgress, Tooltip, Grid,
} from '@mui/material';
import { Add, Edit, Delete, Block, CheckCircle, ArrowBack } from '@mui/icons-material';
import SuperAdminLayout from '../../components/Layout/SuperAdminLayout';
import {
  fetchPlans, createPlan, updatePlan, deletePlan, togglePlanStatus, clearError
} from '../../store/slices/subscriptionPlanSlice';
import { fetchActiveModules } from '../../store/slices/subscriptionModuleSlice';

const SubscriptionPlans = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: plans, loading, error } = useSelector((state) => state.subscriptionPlans);
  const { activeModules } = useSelector((state) => state.subscriptionModules);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    planName: '', planCode: '', description: '',
    monthlyPrice: '', yearlyPrice: '', trialDays: 14,
    maxUsers: 5, maxCompanies: 1, maxStorageMb: 100,
    isActive: true, moduleIds: [],
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchActiveModules());
  }, [dispatch]);

  const handleOpen = (plan = null) => {
    if (plan) {
      setEditItem(plan);
      setForm({
        planName: plan.planName || '',
        planCode: plan.planCode || '',
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice ?? '',
        yearlyPrice: plan.yearlyPrice ?? '',
        trialDays: plan.trialDays ?? 14,
        maxUsers: plan.maxUsers ?? 5,
        maxCompanies: plan.maxCompanies ?? 1,
        maxStorageMb: plan.maxStorageMb ?? 100,
        isActive: plan.isActive !== false,
        moduleIds: (plan.modules || plan.Modules || plan.planModules || []).map(m => m.id || m.moduleId || m.Module?.id).filter(Boolean),
      });
    } else {
      setEditItem(null);
      setForm({
        planName: '', planCode: '', description: '',
        monthlyPrice: '', yearlyPrice: '', trialDays: 14,
        maxUsers: 5, maxCompanies: 1, maxStorageMb: 100,
        isActive: true, moduleIds: [],
      });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditItem(null); };

  const validate = () => {
    const errors = {};
    if (!form.planName) errors.planName = 'Required';
    if (!form.planCode) errors.planCode = 'Required';
    if (!form.monthlyPrice && !form.yearlyPrice) errors.monthlyPrice = 'At least one price required';
    if (!form.maxUsers) errors.maxUsers = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      planName: form.planName,
      planCode: form.planCode,
      description: form.description,
      monthlyPrice: parseFloat(form.monthlyPrice) || 0,
      yearlyPrice: parseFloat(form.yearlyPrice) || 0,
      trialDays: parseInt(form.trialDays) || 14,
      maxUsers: parseInt(form.maxUsers) || 5,
      maxCompanies: parseInt(form.maxCompanies) || 1,
      maxStorageMb: parseInt(form.maxStorageMb) || 100,
      isActive: form.isActive,
      moduleIds: form.moduleIds,
    };
    if (editItem) {
      dispatch(updatePlan({ id: editItem.id, data: payload }));
    } else {
      dispatch(createPlan(payload));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      dispatch(deletePlan(id));
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(togglePlanStatus(id));
  };

  const handleModuleToggle = (moduleId) => {
    setForm(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  if (loading && plans.length === 0) {
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
          <Typography variant="h4" fontWeight={700}>Subscription Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage subscription plans with module assignments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/superadmin')}>
            Dashboard
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Plan
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
              <TableCell sx={{ fontWeight: 600 }}>Plan Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Monthly</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Yearly</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trial</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Max Users</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Modules</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No subscription plans found. Create your first plan!</Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => {
                const modules = plan.modules || plan.Modules || plan.planModules || [];
                return (
                <TableRow key={plan.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{plan.planName}</TableCell>
                  <TableCell><Chip label={plan.planCode} size="small" variant="outlined" /></TableCell>
                  <TableCell>${parseFloat(plan.monthlyPrice || 0).toFixed(2)}</TableCell>
                  <TableCell>${parseFloat(plan.yearlyPrice || 0).toFixed(2)}</TableCell>
                  <TableCell>{plan.trialDays || 0} days</TableCell>
                  <TableCell>{plan.maxUsers}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {modules.slice(0, 3).map((m) => (
                        <Chip key={m.id || m.moduleId} label={m.moduleName || m.Module?.moduleName}
                          size="small" color="primary" variant="outlined" />
                      ))}
                      {modules.length > 3 && (
                        <Chip label={`+${modules.length - 3}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={plan.isActive ? <CheckCircle /> : <Block />}
                      label={plan.isActive ? 'Active' : 'Inactive'}
                      color={plan.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(plan)}><Edit /></IconButton></Tooltip>
                    <Tooltip title={plan.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton size="small" onClick={() => handleToggleStatus(plan.id)} color={plan.isActive ? 'warning' : 'success'}>
                        {plan.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(plan.id)}><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Plan Name" value={form.planName}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
                error={!!formErrors.planName} helperText={formErrors.planName} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Plan Code" value={form.planCode}
                onChange={(e) => setForm({ ...form, planCode: e.target.value })}
                error={!!formErrors.planCode} helperText={formErrors.planCode}
                required placeholder="e.g., starter, pro, enterprise" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} multiline rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Monthly Price" type="number" value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                error={!!formErrors.monthlyPrice} helperText={formErrors.monthlyPrice}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Yearly Price" type="number" value={form.yearlyPrice}
                onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Trial Days" type="number" value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Max Users" type="number" value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                error={!!formErrors.maxUsers} helperText={formErrors.maxUsers} required />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Max Companies" type="number" value={form.maxCompanies}
                onChange={(e) => setForm({ ...form, maxCompanies: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Max Storage (MB)" type="number" value={form.maxStorageMb}
                onChange={(e) => setForm({ ...form, maxStorageMb: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Assigned Modules</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {activeModules.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No modules available. Create modules first.
                  </Typography>
                ) : (
                  activeModules.map((mod) => (
                    <Chip
                      key={mod.id}
                      label={mod.moduleName}
                      color={form.moduleIds.includes(mod.id) ? 'primary' : 'default'}
                      variant={form.moduleIds.includes(mod.id) ? 'filled' : 'outlined'}
                      onClick={() => handleModuleToggle(mod.id)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))
                )}
              </Box>
            </Grid>
          </Grid>
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

export default SubscriptionPlans;
