import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button,
  Tabs, Tab, Divider, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import {
  Business, Person, Notifications, Save,
} from '@mui/icons-material';
import { showSuccess, showError } from '../utils/toast';
import api from '../utils/api';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState({ name: '', code: '', email: '', phone: '', website: '', currency: 'AED', currencySymbol: '', timezone: 'Asia/Dubai', addressLine1: '', addressLine2: '', city: '', state: '', country: 'UAE', postalCode: '', status: '', subscriptionStatus: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [prefs, setPrefs] = useState({ emailNotifications: true, smsNotifications: false, lowBalanceAlert: true, autoExpireNotify: true, language: 'en' });

  const fetchCompany = useCallback(async () => {
    try {
      const { data } = await api.get('/company/profile');
      const c = data.data;
      setCompany({
        name: c?.name || '', code: c?.code || '', email: c?.email || '', phone: c?.phone || '',
        website: c?.website || '', currency: c?.currency || 'AED', currencySymbol: c?.currencySymbol || '',
        timezone: c?.timezone || 'Asia/Dubai', addressLine1: c?.addressLine1 || '',
        addressLine2: c?.addressLine2 || '', city: c?.city || '', state: c?.state || '',
        country: c?.country || 'UAE', postalCode: c?.postalCode || '',
        status: c?.status || '', subscriptionStatus: c?.subscriptionStatus || '',
      });
    } catch {}
  }, []);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const handleCompanySave = async () => {
    if (!company.name) { showError('Company name is required'); return; }
    setSaving(true);
    try {
      await api.put('/company/profile', company);
      showSuccess('Company profile updated');
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showError('Please fill all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { showError(err.response?.data?.message || 'Password change failed'); }
    finally { setLoading(false); }
  };

  const handlePrefsSave = () => {
    showSuccess('Preferences saved');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your company, profile, and preferences</Typography>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Business />} label="Company" iconPosition="start" />
        <Tab icon={<Person />} label="Profile" iconPosition="start" />
        <Tab icon={<Notifications />} label="Preferences" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Company Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Company Name *" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Company Code" value={company.code} disabled helperText="Unique identifier, cannot be changed" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Phone" value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Website" value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Currency" value={company.currency} onChange={e => setCompany({ ...company, currency: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Symbol" value={company.currencySymbol} onChange={e => setCompany({ ...company, currencySymbol: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Timezone" value={company.timezone} onChange={e => setCompany({ ...company, timezone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Country" value={company.country} onChange={e => setCompany({ ...company, country: e.target.value })} />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Address</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Address Line 1" value={company.addressLine1} onChange={e => setCompany({ ...company, addressLine1: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Address Line 2" value={company.addressLine2} onChange={e => setCompany({ ...company, addressLine2: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="City" value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="State" value={company.state} onChange={e => setCompany({ ...company, state: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Postal Code" value={company.postalCode} onChange={e => setCompany({ ...company, postalCode: e.target.value })} />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Status" value={company.status} disabled />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth size="small" label="Subscription" value={company.subscriptionStatus} disabled />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <Save />} onClick={handleCompanySave} disabled={saving}>
                  Save Company Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>My Profile</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="First Name" value={user?.firstName || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Last Name" value={user?.lastName || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Username" value={user?.username || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email" value={user?.email || ''} disabled />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Change Password</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="password" label="Current Password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="password" label="New Password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="password" label="Confirm Password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" startIcon={loading ? <CircularProgress size={18} /> : <Save />} onClick={handlePasswordChange} disabled={loading}>
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Notification Preferences</Typography>
            <FormControlLabel control={<Switch checked={prefs.emailNotifications} onChange={e => setPrefs({ ...prefs, emailNotifications: e.target.checked })} />} label="Email Notifications" />
            <br />
            <FormControlLabel control={<Switch checked={prefs.smsNotifications} onChange={e => setPrefs({ ...prefs, smsNotifications: e.target.checked })} />} label="SMS Notifications" />
            <br />
            <FormControlLabel control={<Switch checked={prefs.lowBalanceAlert} onChange={e => setPrefs({ ...prefs, lowBalanceAlert: e.target.checked })} />} label="Low Balance Alerts" />
            <br />
            <FormControlLabel control={<Switch checked={prefs.autoExpireNotify} onChange={e => setPrefs({ ...prefs, autoExpireNotify: e.target.checked })} />} label="Points Expiry Notifications" />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Language</Typography>
            <TextField select size="small" value={prefs.language} onChange={e => setPrefs({ ...prefs, language: e.target.value })} sx={{ width: 200 }}>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </TextField>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<Save />} onClick={handlePrefsSave}>
                Save Preferences
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Settings;
