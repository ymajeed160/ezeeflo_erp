import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, CircularProgress, Alert, Switch, FormControlLabel, Divider } from '@mui/material';
import { Save } from '@mui/icons-material';
import axios from 'axios';

const API = 'http://localhost:5001/api/superadmin';
const tk = () => { try { return JSON.parse(localStorage.getItem('persist:sa_auth')).accessToken; } catch { return null; } };
const h = () => ({ headers: { Authorization: `Bearer ${tk()}` } });

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get(`${API}/settings`, h()); setSettings(data.data); }
      catch { setError('Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    try { setSaving(true); await axios.put(`${API}/settings`, settings, h()); setSuccess('Settings saved'); }
    catch { setError('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!settings) return <Alert severity="error">Failed to load</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Settings</Typography>
        <Button variant="contained" startIcon={<Save />} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Password Policy</Typography>
            <TextField fullWidth label="Min Length" type="number" value={settings.passwordPolicy.minLength} sx={{ mb: 2 }}
              onChange={e => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) || 8 } })} />
            <FormControlLabel control={<Switch checked={settings.passwordPolicy.requireUppercase}
              onChange={e => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, requireUppercase: e.target.checked } })} />} label="Require Uppercase" />
            <FormControlLabel control={<Switch checked={settings.passwordPolicy.requireNumber}
              onChange={e => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, requireNumber: e.target.checked } })} />} label="Require Number" />
            <FormControlLabel control={<Switch checked={settings.passwordPolicy.requireSpecial}
              onChange={e => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, requireSpecial: e.target.checked } })} />} label="Require Special Character" />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Session & Lockout</Typography>
            <TextField fullWidth label="Session Timeout (minutes)" type="number" value={settings.sessionTimeout} sx={{ mb: 2 }}
              onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 720 })} />
            <TextField fullWidth label="Max Login Attempts" type="number" value={settings.maxLoginAttempts} sx={{ mb: 2 }}
              onChange={e => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })} />
            <TextField fullWidth label="Lockout Duration (minutes)" type="number" value={settings.lockoutDuration}
              onChange={e => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 30 })} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Notifications</Typography>
            <FormControlLabel control={<Switch checked={settings.notifications.emailOnCompanyCreate}
              onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, emailOnCompanyCreate: e.target.checked } })} />} label="Email on Company Create" />
            <FormControlLabel control={<Switch checked={settings.notifications.emailOnSuspension}
              onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, emailOnSuspension: e.target.checked } })} />} label="Email on Suspension" />
            <FormControlLabel control={<Switch checked={settings.notifications.emailOnExpiry}
              onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, emailOnExpiry: e.target.checked } })} />} label="Email on Subscription Expiry" />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Security</Typography>
            <FormControlLabel control={<Switch checked={settings.mfaEnabled}
              onChange={e => setSettings({ ...settings, mfaEnabled: e.target.checked })} />} label="Enable MFA for Super Admins" />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
