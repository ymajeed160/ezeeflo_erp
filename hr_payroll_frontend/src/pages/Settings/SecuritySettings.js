import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel, MenuItem, Alert, Grid, Divider,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function SecuritySettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getSecurity(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updateSecurity(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Security Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure password policies, session management & access controls</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>Password Policy</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={4}><TextField label="Min Length" type="number" fullWidth size="small" value={form.passwordMinLength || ''} onChange={e => set('passwordMinLength', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={4}><TextField select label="Complexity" fullWidth size="small" value={form.passwordComplexity || ''} onChange={e => set('passwordComplexity', e.target.value)}><MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField label="Expiry (days)" type="number" fullWidth size="small" value={form.passwordExpiryDays || ''} onChange={e => set('passwordExpiryDays', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={12}><FormControlLabel control={<Switch checked={!!form.forcePasswordReset} onChange={e => set('forcePasswordReset', e.target.checked)} />} label="Force Password Reset for All Users" /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Session & Login</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={4}><TextField label="Session Timeout (min)" type="number" fullWidth size="small" value={form.sessionTimeoutMinutes || ''} onChange={e => set('sessionTimeoutMinutes', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={4}><TextField label="Max Login Attempts" type="number" fullWidth size="small" value={form.maxLoginAttempts || ''} onChange={e => set('maxLoginAttempts', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={4}><TextField label="Lockout Duration (min)" type="number" fullWidth size="small" value={form.lockoutDurationMinutes || ''} onChange={e => set('lockoutDurationMinutes', parseInt(e.target.value) || 0)} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>MFA & Access Control</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.mfaEnabled} onChange={e => set('mfaEnabled', e.target.checked)} />} label="Enable MFA" /></Grid>
        <Grid item xs={6}><TextField select label="MFA Type" fullWidth size="small" value={form.mfaType || ''} onChange={e => set('mfaType', e.target.value)} disabled={!form.mfaEnabled}><MenuItem value="sms">SMS</MenuItem><MenuItem value="email">Email</MenuItem><MenuItem value="authenticator">Authenticator App</MenuItem></TextField></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.ipWhitelistingEnabled} onChange={e => set('ipWhitelistingEnabled', e.target.checked)} />} label="IP Whitelisting" /></Grid>
        <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.dataEncryptionEnabled} onChange={e => set('dataEncryptionEnabled', e.target.checked)} />} label="Data-at-Rest Encryption" /></Grid>
        <Grid item xs={12}><TextField label="Whitelisted IPs" fullWidth size="small" value={form.allowedIps || ''} onChange={e => set('allowedIps', e.target.value)} disabled={!form.ipWhitelistingEnabled} multiline rows={2} /></Grid>
        <Grid item xs={6}><TextField label="Audit Log Retention (days)" type="number" fullWidth size="small" value={form.auditLogRetentionDays || ''} onChange={e => set('auditLogRetentionDays', parseInt(e.target.value) || 0)} /></Grid>
      </Grid>
    </Box>
  );
}
