import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField, IconButton, MenuItem, Switch, FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Star, StarBorder, Group } from '@mui/icons-material';
import membershipApi from '../services/membershipApi';
import { showSuccess, showError } from '../utils/toast';

const defaultForm = { name: '', code: '', description: '', minPoints: 0, maxPoints: '', pointMultiplier: 1.0, color: '#6B7280', benefits: '', sortOrder: 0 };

const MembershipTiers = () => {
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tier: null });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tiersRes, statsRes] = await Promise.all([
        membershipApi.getTiers({ limit: 100 }),
        membershipApi.getTierStats(),
      ]);
      setTiers(tiersRes.data.data || []);
      setStats(statsRes.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingTier(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (tier) => { setEditingTier(tier); setForm({ ...tier, maxPoints: tier.maxPoints || '', benefits: typeof tier.benefits === 'string' ? tier.benefits : JSON.stringify(tier.benefits || {}, null, 2) }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { showError('Name and code are required'); return; }
    setSaving(true);
    try {
      let payload = { ...form, minPoints: parseInt(form.minPoints) || 0, maxPoints: form.maxPoints ? parseInt(form.maxPoints) : null, pointMultiplier: parseFloat(form.pointMultiplier) || 1.0, sortOrder: parseInt(form.sortOrder) || 0 };
      if (payload.benefits && typeof payload.benefits === 'string') {
        try { payload.benefits = JSON.parse(payload.benefits); } catch { payload.benefits = {}; }
      }
      if (editingTier) {
        await membershipApi.updateTier(editingTier.id, payload);
        showSuccess('Tier updated');
      } else {
        await membershipApi.createTier(payload);
        showSuccess('Tier created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await membershipApi.deleteTier(deleteDialog.tier.id);
      showSuccess('Tier deleted');
      setDeleteDialog({ open: false, tier: null });
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  const handleToggle = async (tier) => {
    try {
      await membershipApi.toggleTierStatus(tier.id);
      showSuccess(`Tier ${tier.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) { showError(err.response?.data?.message || 'Toggle failed'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Membership Tiers</Typography>
          <Typography variant="body2" color="text.secondary">Configure loyalty membership levels and benefits</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Tier</Button>
      </Box>

      {/* Tier Stats Overview */}
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.id}>
            <Card sx={{ borderTop: `4px solid ${stat.color || '#6B7280'}`, height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  {stat.sortOrder >= 3 ? <Star sx={{ color: stat.color }} /> : <StarBorder sx={{ color: stat.color }} />}
                  <Typography variant="h6" fontWeight={700} sx={{ color: stat.color }}>{stat.name}</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>{stat.customerCount}</Typography>
                <Typography variant="caption" color="text.secondary">Members</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{stat.minPoints.toLocaleString()}+ pts</Typography>
                <Typography variant="caption" color="text.secondary">{stat.pointMultiplier}x multiplier</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button size="small" onClick={() => openEdit(tiers.find(t => t.id === stat.id))}>Edit</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* All Tiers Table-like Cards */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>All Tiers</Typography>
      <Grid container spacing={2}>
        {tiers.map((tier) => (
          <Grid item xs={12} key={tier.id}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${tier.color || '#6B7280'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star sx={{ color: tier.color || '#6B7280' }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>{tier.name}</Typography>
                    <Typography variant="caption" color="text.secondary">({tier.code})</Typography>
                    <Chip label={tier.isActive ? 'Active' : 'Inactive'} color={tier.isActive ? 'success' : 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tier.minPoints.toLocaleString()}{tier.maxPoints ? ` - ${tier.maxPoints.toLocaleString()}` : '+'} points • {tier.pointMultiplier}x multiplier
                  </Typography>
                  {tier.description && <Typography variant="caption" color="text.secondary">{tier.description}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(tier)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={tier.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => handleToggle(tier)} color={tier.isActive ? 'warning' : 'success'}>
                    {tier.isActive ? <StarBorder fontSize="small" /> : <Star fontSize="small" />}
                  </IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, tier })} color="error"><Delete fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingTier ? 'Edit Membership Tier' : 'New Membership Tier'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Tier Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} size="small" helperText="Lowercase with underscores (e.g. gold_elite)" disabled={!!editingTier} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Min Points" type="number" value={form.minPoints} onChange={(e) => setForm({ ...form, minPoints: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Max Points" type="number" value={form.maxPoints} onChange={(e) => setForm({ ...form, maxPoints: e.target.value })} size="small" helperText="Leave empty for unlimited" />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Point Multiplier" type="number" value={form.pointMultiplier} onChange={(e) => setForm({ ...form, pointMultiplier: e.target.value })} size="small" inputProps={{ step: 0.25 }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} size="small" type="color" sx={{ '& input': { height: 32 } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Benefits (JSON)" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} size="small" multiline rows={3} helperText={'JSON object with benefit flags e.g. {"birthday_bonus": true, "free_shipping": true}'} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, tier: null })}>
        <DialogTitle>Delete Tier</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete "{deleteDialog.tier?.name}"? This cannot be undone if the tier has assigned members.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, tier: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MembershipTiers;
