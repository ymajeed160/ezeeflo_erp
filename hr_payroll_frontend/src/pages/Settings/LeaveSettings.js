import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel, MenuItem, Alert, Grid, Divider,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function LeaveSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getLeave(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updateLeave(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Leave Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure leave accrual, carry-forward, approval workflow & policies</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>Accrual & Balance</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField label="Leave Year Start (MM-DD)" fullWidth size="small" value={form.leaveYearStart || ''} onChange={e => set('leaveYearStart', e.target.value)} placeholder="01-01" /></Grid>
        <Grid item xs={6}><TextField select label="Accrual Method" fullWidth size="small" value={form.accrualMethod || ''} onChange={e => set('accrualMethod', e.target.value)}><MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annual">Annual</MenuItem><MenuItem value="custom">Custom</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField label="Accrual Rate (days/month)" type="number" fullWidth size="small" value={form.accrualRate || ''} onChange={e => set('accrualRate', parseFloat(e.target.value) || 0)} inputProps={{ step: 0.1 }} /></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.negativeBalanceAllowed} onChange={e => set('negativeBalanceAllowed', e.target.checked)} />} label="Allow Negative Balance" /></Grid>
        <Grid item xs={6}><TextField label="Max Negative Balance (days)" type="number" fullWidth size="small" value={form.negativeBalanceMax || ''} onChange={e => set('negativeBalanceMax', parseInt(e.target.value) || 0)} disabled={!form.negativeBalanceAllowed} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Carry Forward</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.carryForwardEnabled} onChange={e => set('carryForwardEnabled', e.target.checked)} />} label="Enable Carry Forward" /></Grid>
        <Grid item xs={4}><TextField label="Max Carry Forward (days)" type="number" fullWidth size="small" value={form.carryForwardMax || ''} onChange={e => set('carryForwardMax', parseInt(e.target.value) || 0)} disabled={!form.carryForwardEnabled} /></Grid>
        <Grid item xs={4}><TextField label="Expiry Date (MM-DD)" fullWidth size="small" value={form.carryForwardExpiry || ''} onChange={e => set('carryForwardExpiry', e.target.value)} disabled={!form.carryForwardEnabled} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Approval & Restrictions</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={4}><TextField select label="Approval Workflow" fullWidth size="small" value={form.approvalWorkflow || ''} onChange={e => set('approvalWorkflow', e.target.value)}><MenuItem value="direct_manager">Direct Manager</MenuItem><MenuItem value="multi_level">Multi-Level</MenuItem><MenuItem value="hr_only">HR Only</MenuItem></TextField></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.autoApproveEnabled} onChange={e => set('autoApproveEnabled', e.target.checked)} />} label="Auto Approve" /></Grid>
        <Grid item xs={4}><TextField label="Min Notice (days)" type="number" fullWidth size="small" value={form.minNoticeDays || ''} onChange={e => set('minNoticeDays', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={4}><TextField label="Max Consecutive Days" type="number" fullWidth size="small" value={form.maxConsecutiveDays || ''} onChange={e => set('maxConsecutiveDays', parseInt(e.target.value) || 0)} helperText="0 = unlimited" /></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.weekendIncluded} onChange={e => set('weekendIncluded', e.target.checked)} />} label="Count Weekends" /></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.holidayIncluded} onChange={e => set('holidayIncluded', e.target.checked)} />} label="Count Holidays" /></Grid>
      </Grid>
    </Box>
  );
}
