import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Alert, Grid, Divider } from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function SmsSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getSms(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updateSms(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">SMS Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure SMS gateway provider & sending limits</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>SMS Provider</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField select label="Provider" fullWidth size="small" value={form.provider || ''} onChange={e => set('provider', e.target.value)}><MenuItem value="twilio">Twilio</MenuItem><MenuItem value="nexmo">Vonage (Nexmo)</MenuItem><MenuItem value="infobip">Infobip</MenuItem><MenuItem value="custom">Custom API</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField label="Sender ID" fullWidth size="small" value={form.senderId || ''} onChange={e => set('senderId', e.target.value)} placeholder="Ezeeflo" /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>API Credentials</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField label="API Key / Account SID" fullWidth size="small" value={form.apiKey || ''} onChange={e => set('apiKey', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField label="API Secret / Auth Token" type="password" fullWidth size="small" value={form.apiSecret || ''} onChange={e => set('apiSecret', e.target.value)} /></Grid>
        <Grid item xs={12}><TextField label="Custom API URL" fullWidth size="small" value={form.apiUrl || ''} onChange={e => set('apiUrl', e.target.value)} disabled={form.provider !== 'custom'} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Limits & Alerts</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField label="Daily SMS Limit" type="number" fullWidth size="small" value={form.dailyLimit || ''} onChange={e => set('dailyLimit', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={6}><TextField label="Balance Alert Threshold" type="number" fullWidth size="small" value={form.balanceAlertThreshold || ''} onChange={e => set('balanceAlertThreshold', parseInt(e.target.value) || 0)} helperText="Notify when remaining below this" /></Grid>
      </Grid>
    </Box>
  );
}
