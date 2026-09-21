import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, IconButton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, CardGiftcard } from '@mui/icons-material';
import { getPlans, createPlan, updatePlan, deletePlan, seedDefaultPlans } from '../../services/superAdminSubscriptionService';

const BILLING_CYCLES = ['monthly', 'quarterly', 'biannually', 'annually'];

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, plan: null });
  const [form, setForm] = useState({ name: '', code: '', price: 0, billingCycle: 'annually', maxEmployees: 50, maxUsers: 10, maxBranches: 5, maxDepartments: 10, storageLimitMb: 1024, gracePeriodDays: 15, isActive: true, sortOrder: 0 });

  const fetch = async () => {
    try { setLoading(true); setPlans(await getPlans()); }
    catch (e) { setError('Failed to load plans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openDialog = (plan = null) => {
    if (plan) {
      setForm({ name: plan.name, code: plan.code, price: plan.price, billingCycle: plan.billingCycle, maxEmployees: plan.maxEmployees, maxUsers: plan.maxUsers, maxBranches: plan.maxBranches, maxDepartments: plan.maxDepartments, storageLimitMb: plan.storageLimitMb, gracePeriodDays: plan.gracePeriodDays, isActive: plan.isActive, sortOrder: plan.sortOrder });
    } else {
      setForm({ name: '', code: '', price: 0, billingCycle: 'annually', maxEmployees: 50, maxUsers: 10, maxBranches: 5, maxDepartments: 10, storageLimitMb: 1024, gracePeriodDays: 15, isActive: true, sortOrder: 0 });
    }
    setDialog({ open: true, plan });
  };

  const save = async () => {
    try {
      dialog.plan ? await updatePlan(dialog.plan.id, form) : await createPlan(form);
      setDialog({ open: false, plan: null }); fetch();
    } catch (e) { setError('Save failed'); }
  };

  const remove = async (id) => {
    try { await deletePlan(id); fetch(); } catch { setError('Delete failed'); }
  };

  const seed = async () => {
    try { await seedDefaultPlans(); fetch(); } catch { setError('Seed failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>Subscription Plans</Typography>
        <Stack direction="row" spacing={1}>
          {plans.length === 0 && <Button variant="outlined" startIcon={<CardGiftcard />} onClick={seed}>Seed Default Plans</Button>}
          <Button variant="contained" startIcon={<Add />} onClick={() => openDialog()}>Add Plan</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cycle</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Storage (MB)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Grace (Days)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>No plans. Click "Seed Default Plans" to create defaults.</TableCell></TableRow>
            ) : plans.map(p => (
              <TableRow key={p.id} hover>
                <TableCell><Typography fontWeight={600}>{p.name}</Typography><Typography variant="caption" color="text.secondary">{p.code}</Typography></TableCell>
                <TableCell>${p.price}</TableCell>
                <TableCell><Chip label={p.billingCycle} size="small" /></TableCell>
                <TableCell>{p.maxEmployees}</TableCell>
                <TableCell>{p.maxUsers}</TableCell>
                <TableCell>{p.storageLimitMb}</TableCell>
                <TableCell>{p.gracePeriodDays}</TableCell>
                <TableCell><Chip label={p.isActive ? 'Active' : 'Inactive'} color={p.isActive ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(p.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, plan: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.plan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Price ($)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Billing Cycle" value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}>{BILLING_CYCLES.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField></Grid>
            <Grid item xs={4}><TextField fullWidth label="Max Employees" type="number" value={form.maxEmployees} onChange={e => setForm({ ...form, maxEmployees: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Max Users" type="number" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Storage (MB)" type="number" value={form.storageLimitMb} onChange={e => setForm({ ...form, storageLimitMb: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Grace Period (Days)" type="number" value={form.gracePeriodDays} onChange={e => setForm({ ...form, gracePeriodDays: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, plan: null })}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscriptions;
