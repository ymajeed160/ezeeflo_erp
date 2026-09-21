import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment,
  IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Redeem, CardGiftcard, Search } from '@mui/icons-material';
import rewardApi from '../services/rewardApi';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const rewardTypeIcons = {
  gift_voucher: '🎁', free_product: '🛍️', discount: '🏷️', cash_voucher: '💵',
  service: '🔧', membership_upgrade: '⭐', other: '📦',
};

const rewardTypeLabels = {
  gift_voucher: 'Gift Voucher', free_product: 'Free Product', discount: 'Discount',
  cash_voucher: 'Cash Voucher', service: 'Service', membership_upgrade: 'Membership Upgrade', other: 'Other',
};

const defaultForm = { name: '', code: '', description: '', rewardType: 'gift_voucher', pointsRequired: '', value: '', validityDays: '', stockQuantity: '-1', redemptionLimitPerCustomer: '-1', termsConditions: '', image: '' };

const RewardsCatalog = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, reward: null });

  // Redeem dialog
  const [redeemDialog, setRedeemDialog] = useState({ open: false, reward: null });
  const [customers, setCustomers] = useState([]);
  const [redeemCustomerId, setRedeemCustomerId] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const fetchRewards = useCallback(async () => {
    try {
      const { data } = await rewardApi.getAll({ limit: 100, search });
      setRewards(data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const openCreate = () => { setEditingReward(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (reward) => { setEditingReward(reward); setForm({ ...reward, pointsRequired: String(reward.pointsRequired), value: reward.value || '', stockQuantity: String(reward.stockQuantity ?? -1), redemptionLimitPerCustomer: String(reward.redemptionLimitPerCustomer ?? -1), validityDays: reward.validityDays || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { showError('Name and code required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, pointsRequired: parseInt(form.pointsRequired) || 0, value: form.value ? parseFloat(form.value) : null, stockQuantity: parseInt(form.stockQuantity) ?? -1, redemptionLimitPerCustomer: parseInt(form.redemptionLimitPerCustomer) ?? -1, validityDays: form.validityDays ? parseInt(form.validityDays) : null };
      if (editingReward) { await rewardApi.update(editingReward.id, payload); showSuccess('Reward updated'); }
      else { await rewardApi.create(payload); showSuccess('Reward created'); }
      setDialogOpen(false); fetchRewards();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await rewardApi.delete(deleteDialog.reward.id); showSuccess('Reward deleted'); setDeleteDialog({ open: false, reward: null }); fetchRewards(); }
    catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  const handleToggle = async (reward) => {
    try { await rewardApi.toggleStatus(reward.id); showSuccess(`Reward ${reward.isActive ? 'deactivated' : 'activated'}`); fetchRewards(); }
    catch (err) { showError(err.response?.data?.message || 'Toggle failed'); }
  };

  const openRedeem = async (reward) => {
    setRedeemDialog({ open: true, reward });
    try {
      const { data } = await customerApi.getAll({ limit: 200, isActive: true });
      setCustomers(data.data || []);
    } catch { setCustomers([]); }
  };

  const handleRedeem = async () => {
    if (!redeemCustomerId) { showError('Select a customer'); return; }
    setRedeeming(true);
    try {
      const { data } = await rewardApi.redeem({ rewardId: redeemDialog.reward.id, customerId: redeemCustomerId });
      showSuccess(data.message);
      setRedeemDialog({ open: false, reward: null }); setRedeemCustomerId('');
      fetchRewards();
    } catch (err) { showError(err.response?.data?.message || 'Redemption failed'); } finally { setRedeeming(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h5">Reward Catalog</Typography><Typography variant="body2" color="text.secondary">Create and manage redeemable rewards</Typography></Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Reward</Button>
      </Box>

      <TextField placeholder="Search rewards..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ mb: 3, width: 300 }} />

      <Grid container spacing={3}>
        {rewards.map((reward) => (
          <Grid item xs={12} sm={6} md={4} key={reward.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: reward.isActive ? 1 : 0.6 }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h2">{rewardTypeIcons[reward.rewardType] || '📦'}</Typography>
                  <Chip label={rewardTypeLabels[reward.rewardType] || reward.rewardType} size="small" variant="outlined" />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>{reward.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{reward.code}</Typography>
                {reward.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{reward.description}</Typography>}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${reward.pointsRequired.toLocaleString()} pts`} color="primary" size="small" />
                  {reward.value > 0 && <Chip label={`AED ${reward.value}`} size="small" variant="outlined" />}
                  {reward.stockQuantity >= 0 && <Chip label={`Stock: ${reward.stockQuantity}`} size="small" />}
                  {!reward.isActive && <Chip label="Inactive" color="default" size="small" />}
                </Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button size="small" startIcon={<Redeem />} variant="contained" color="success" onClick={() => openRedeem(reward)} disabled={!reward.isActive}>Redeem</Button>
                <Button size="small" startIcon={<Edit />} onClick={() => openEdit(reward)}>Edit</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={reward.isActive ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(reward)} color={reward.isActive ? 'warning' : 'success'}>
                    <CardGiftcard fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, reward })}><Delete fontSize="small" /></IconButton></Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {rewards.length === 0 && (
          <Grid item xs={12}><Box sx={{ textAlign: 'center', py: 6 }}>
            <CardGiftcard sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" sx={{ mb: 2 }}>No rewards yet</Typography>
            <Button variant="outlined" onClick={openCreate}>Create First Reward</Button>
          </Box></Grid>
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingReward ? 'Edit Reward' : 'New Reward'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Name *" size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Code *" size="small" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editingReward} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small"><InputLabel>Type *</InputLabel>
                <Select value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value })} label="Type *">
                  {Object.entries(rewardTypeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Points Required *" type="number" size="small" value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Value (AED)" type="number" size="small" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Validity (Days)" type="number" size="small" value={form.validityDays} onChange={(e) => setForm({ ...form, validityDays: e.target.value })} helperText="Empty = no expiry" /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Stock Quantity" type="number" size="small" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} helperText="-1 = unlimited" /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Per Customer Limit" type="number" size="small" value={form.redemptionLimitPerCustomer} onChange={(e) => setForm({ ...form, redemptionLimitPerCustomer: e.target.value })} helperText="-1 = unlimited" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Image URL" size="small" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Terms & Conditions" size="small" multiline rows={2} value={form.termsConditions} onChange={(e) => setForm({ ...form, termsConditions: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, reward: null })}>
        <DialogTitle>Delete Reward</DialogTitle>
        <DialogContent><DialogContentText>Delete "{deleteDialog.reward?.name}"? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setDeleteDialog({ open: false, reward: null })}>Cancel</Button><Button onClick={handleDelete} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialog.open} onClose={() => setRedeemDialog({ open: false, reward: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Redeem Reward</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6">{redeemDialog.reward?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{rewardTypeLabels[redeemDialog.reward?.rewardType]} • {redeemDialog.reward?.pointsRequired?.toLocaleString()} points</Typography>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel>Select Customer</InputLabel>
            <Select value={redeemCustomerId} onChange={(e) => setRedeemCustomerId(e.target.value)} label="Select Customer">
              {customers.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName || ''} ({c.code}) - {c.loyaltyAccount?.availablePoints || 0} pts
                  {c.loyaltyAccount?.availablePoints < redeemDialog.reward?.pointsRequired && ' ⚠️ Insufficient'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemDialog({ open: false, reward: null })}>Cancel</Button>
          <Button onClick={handleRedeem} variant="contained" color="success" disabled={redeeming || !redeemCustomerId} startIcon={<Redeem />}>
            {redeeming ? <CircularProgress size={20} /> : 'Confirm Redemption'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardsCatalog;
