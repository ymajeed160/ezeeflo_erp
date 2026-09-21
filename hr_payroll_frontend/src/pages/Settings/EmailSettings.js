import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Alert, Grid, Divider } from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

export default function EmailSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getEmail(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updateEmail(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Email Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure SMTP server, sender identity & email templates</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>SMTP Configuration</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={8}><TextField label="SMTP Host" fullWidth size="small" value={form.smtpHost || ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" /></Grid>
        <Grid item xs={4}><TextField label="Port" type="number" fullWidth size="small" value={form.smtpPort || ''} onChange={e => set('smtpPort', parseInt(e.target.value) || 0)} /></Grid>
        <Grid item xs={6}><TextField label="Username" fullWidth size="small" value={form.smtpUsername || ''} onChange={e => set('smtpUsername', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField label="Password" type="password" fullWidth size="small" value={form.smtpPassword || ''} onChange={e => set('smtpPassword', e.target.value)} /></Grid>
        <Grid item xs={6}><TextField select label="Encryption" fullWidth size="small" value={form.smtpEncryption || 'tls'} onChange={e => set('smtpEncryption', e.target.value)}><MenuItem value="tls">TLS</MenuItem><MenuItem value="ssl">SSL</MenuItem><MenuItem value="none">None</MenuItem></TextField></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Sender Identity</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}><TextField label="From Name" fullWidth size="small" value={form.fromName || ''} onChange={e => set('fromName', e.target.value)} placeholder="EzeeFlo HR" /></Grid>
        <Grid item xs={6}><TextField label="From Email" fullWidth size="small" value={form.fromEmail || ''} onChange={e => set('fromEmail', e.target.value)} placeholder="hr@company.com" /></Grid>
        <Grid item xs={6}><TextField label="Reply-To Email" fullWidth size="small" value={form.replyTo || ''} onChange={e => set('replyTo', e.target.value)} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Email Footer</Typography>
      <Divider sx={{ mb: 2 }} />
      <TextField label="Email Footer" fullWidth multiline rows={3} value={form.emailFooter || ''} onChange={e => set('emailFooter', e.target.value)} placeholder="Best regards,&#10;HR Department&#10;Company Name" />
    </Box>
  );
}
