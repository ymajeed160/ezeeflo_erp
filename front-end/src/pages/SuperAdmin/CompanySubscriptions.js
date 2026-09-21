import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, Tooltip, Grid, FormControlLabel, Switch,
} from '@mui/material';
import { Add, Edit, Cancel as CancelIcon, Visibility, ArrowBack } from '@mui/icons-material';
import SuperAdminLayout from '../../components/Layout/SuperAdminLayout';
import {
  fetchSubscriptions, createSubscription, updateSubscription,
  cancelSubscription, clearError
} from '../../store/slices/companySubscriptionSlice';
import { fetchPlansWithModules } from '../../store/slices/subscriptionPlanSlice';
import axiosInstance from '../../services/axiosInstance';
import dayjs from 'dayjs';

const statusColors = {
  active: 'success',
  trial: 'info',
  expired: 'error',
  cancelled: 'warning',
  suspended: 'default',
};

const billingCycleOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
];

const CompanySubscriptions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: subscriptions, loading, error } = useSelector((state) => state.companySubscriptions);
  const { items: plans } = useSelector((state) => state.subscriptionPlans);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState({
    companyId: '', planId: '', endDate: '',
    billingCycle: 'monthly', isTrial: true, trialDays: 14,
    autoRenew: true, notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchSubscriptions());
    dispatch(fetchPlansWithModules());
    // Fetch all companies for the dropdown
    setCompaniesLoading(true);
    axiosInstance.get('/superadmin/companies').then(({ data }) => {
      if (data?.data) setCompanies(data.data);
    }).catch(() => {}).finally(() => setCompaniesLoading(false));
  }, [dispatch]);

  const handleOpen = (sub = null) => {
    if (sub) {
      setEditItem(sub);
      setForm({
        companyId: sub.companyId || '',
        planId: sub.planId || '',
        endDate: sub.endDate ? dayjs(sub.endDate).format('YYYY-MM-DD') : '',
        billingCycle: sub.billingCycle || 'monthly',
        isTrial: sub.isTrial !== false,
        trialDays: sub.trialDays || 14,
        autoRenew: sub.autoRenew !== false,
        notes: sub.notes || '',
      });
    } else {
      setEditItem(null);
      setForm({
        companyId: '', planId: '', endDate: '',
        billingCycle: 'monthly', isTrial: true, trialDays: 14,
        autoRenew: true, notes: '',
      });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditItem(null); };
  const handleViewClose = () => { setViewOpen(false); setViewItem(null); };

  const handleView = (sub) => {
    setViewItem(sub);
    setViewOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.companyId) errors.companyId = 'Required';
    if (!form.planId) errors.planId = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      companyId: form.companyId,
      planId: form.planId,
      billingCycle: form.billingCycle,
      endDate: form.endDate ? dayjs(form.endDate).toISOString() : undefined,
      isTrial: form.isTrial,
      trialDays: parseInt(form.trialDays) || 14,
      autoRenew: form.autoRenew,
    };
    if (editItem) {
      dispatch(updateSubscription({ id: editItem.id, data: payload }));
    } else {
      dispatch(createSubscription(payload));
    }
    handleClose();
  };

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      dispatch(cancelSubscription(id));
    }
  };

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.planName : planId;
  };

  if (loading && subscriptions.length === 0) {
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
          <Typography variant="h4" fontWeight={700}>Company Subscriptions</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage subscriptions for all companies
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/superadmin')}>
            Dashboard
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Subscription
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
              <TableCell sx={{ fontWeight: 600 }}>Subscription #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Billing</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No subscriptions found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{sub.subscriptionNumber || sub.id?.slice(0, 8)}</TableCell>
                  <TableCell>{sub.company?.name || sub.companyName || sub.companyId?.slice(0, 8)}</TableCell>
                  <TableCell>{sub.plan?.planName || getPlanName(sub.planId)}</TableCell>
                  <TableCell>
                    <Chip
                      label={sub.status}
                      color={statusColors[sub.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{sub.startDate ? dayjs(sub.startDate).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell>{sub.endDate ? dayjs(sub.endDate).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{sub.billingCycle || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details"><IconButton size="small" onClick={() => handleView(sub)}><Visibility /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(sub)}><Edit /></IconButton></Tooltip>
                    {sub.status === 'active' || sub.status === 'trial' ? (
                      <Tooltip title="Cancel Subscription">
                        <IconButton size="small" color="error" onClick={() => handleCancel(sub.id)}><CancelIcon /></IconButton>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Subscription' : 'Create New Subscription'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth select label="Company" value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              error={!!formErrors.companyId} helperText={formErrors.companyId || 'Select a company'} required>
              {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.email || c.id})</MenuItem>)}
            </TextField>
            <TextField fullWidth select label="Plan" value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              error={!!formErrors.planId} helperText={formErrors.planId} required>
              {plans.map(p => <MenuItem key={p.id} value={p.id}>{p.planName} (${p.monthlyPrice}/mo - ${p.yearlyPrice}/yr)</MenuItem>)}
            </TextField>
            <TextField fullWidth select label="Billing Cycle" value={form.billingCycle}
              onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
              {billingCycleOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="End Date" type="date" value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Trial Days" type="number" value={form.trialDays}
                  onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
              </Grid>
            </Grid>
            <FormControlLabel
              control={<Switch checked={form.isTrial} onChange={(e) => setForm({ ...form, isTrial: e.target.checked })} />}
              label="Start as Trial"
            />
            <FormControlLabel
              control={<Switch checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />}
              label="Auto Renew"
            />
            <TextField fullWidth label="Notes" value={form.notes} multiline rows={2}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="sm" fullWidth>
        <DialogTitle>Subscription Details</DialogTitle>
        <DialogContent dividers>
          {viewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Subscription #</Typography>
                  <Typography variant="body1" fontWeight={500}>{viewItem.subscriptionNumber || viewItem.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box><Chip label={viewItem.status} color={statusColors[viewItem.status] || 'default'} size="small" /></Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Plan</Typography>
                  <Typography variant="body1">{viewItem.plan?.planName || getPlanName(viewItem.planId)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Billing Cycle</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{viewItem.billingCycle || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">{viewItem.startDate ? dayjs(viewItem.startDate).format('DD/MM/YYYY') : '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">{viewItem.endDate ? dayjs(viewItem.endDate).format('DD/MM/YYYY') : '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Trial End</Typography>
                  <Typography variant="body1">{viewItem.trialEndDate ? dayjs(viewItem.trialEndDate).format('DD/MM/YYYY') : '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Cancelled At</Typography>
                  <Typography variant="body1">{viewItem.cancelledAt ? dayjs(viewItem.cancelledAt).format('DD/MM/YYYY') : '-'}</Typography>
                </Grid>
                {viewItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{viewItem.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              {viewItem.modules && viewItem.modules.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Enabled Modules</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewItem.modules.map((m) => (
                      <Chip key={m.id} label={m.moduleName || m.Module?.moduleName || m.moduleId}
                        size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </SuperAdminLayout>
  );
};

export default CompanySubscriptions;
