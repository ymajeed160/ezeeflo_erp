import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Switch, FormControlLabel, Alert, Grid, Divider, Chip,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import SettingsApi from '../../services/settingsApi';

const alertTypes = [
  { key: 'leaveAlert', label: 'Leave Requests & Approvals', color: 'primary' },
  { key: 'attendanceAlert', label: 'Attendance & Time Tracking', color: 'info' },
  { key: 'payrollAlert', label: 'Payroll Processing', color: 'success' },
  { key: 'documentExpiryAlert', label: 'Document Expiry (Visa, Passport)', color: 'warning' },
  { key: 'birthdayAlert', label: 'Employee Birthdays', color: 'secondary' },
  { key: 'onboardingAlert', label: 'Onboarding & Offboarding', color: 'default' },
];

export default function NotificationSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await SettingsApi.getNotifications(); setForm(r.data?.data || r.data || {}); } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try { await SettingsApi.updateNotifications(form); setMsg('Saved'); setTimeout(() => setMsg(''), 3000); } catch (e) { setMsg('Error: ' + e.message); }
  };

  if (!form) return <Typography>Loading...</Typography>;
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Notification Settings</Typography>
          <Typography variant="body2" color="text.secondary">Control how and when notifications are sent</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
        </Box>
      </Box>
      {msg && <Alert severity={msg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}

      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>Notification Channels</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.emailNotifications} onChange={e => set('emailNotifications', e.target.checked)} />} label={<><Chip label="Email" size="small" sx={{ mr: 1 }} /> Enable</>} /></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.smsNotifications} onChange={e => set('smsNotifications', e.target.checked)} />} label={<><Chip label="SMS" size="small" sx={{ mr: 1 }} /> Enable</>} /></Grid>
        <Grid item xs={4}><FormControlLabel control={<Switch checked={!!form.pushNotifications} onChange={e => set('pushNotifications', e.target.checked)} />} label={<><Chip label="Push" size="small" sx={{ mr: 1 }} /> Enable</>} /></Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Alert Types</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={1}>
        {alertTypes.map(a => (
          <Grid item xs={6} key={a.key}>
            <FormControlLabel
              control={<Switch checked={form[a.key] !== false} onChange={e => set(a.key, e.target.checked)} />}
              label={a.label}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>Timing</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Alert severity="info">Document expiry alerts will be sent <strong>{form.alertDaysBefore || 7} days</strong> before expiry. You can configure this below.</Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
