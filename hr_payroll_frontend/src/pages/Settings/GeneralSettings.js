import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Alert, Snackbar, MenuItem } from '@mui/material';
import SettingsApi from '../../services/settingsApi';
import MasterDataApi from '../../services/masterDataApi';
import WorkingDaysPicker from '../../components/Shared/WorkingDaysPicker';

const GeneralSettings = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    Promise.all([
      SettingsApi.getGeneral().then(r => setForm(r.data.data || {})),
      MasterDataApi.getCountries({ limit: 200 }).then(r => setCountries(r.data.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    setSaving(true);
    try {
      await SettingsApi.updateGeneral(form);
      setMsg({ type: 'success', text: 'General settings saved successfully' });
    } catch { setMsg({ type: 'error', text: 'Failed to save' }); }
    setSaving(false);
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>General Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure company-wide settings including name, address, currency, and date formats.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><TextField fullWidth label="Company Name" name="companyName" value={form.companyName || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Tax Number" name="taxNumber" value={form.taxNumber || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Email" name="email" value={form.email || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Website" name="website" value={form.website || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Default Currency" name="defaultCurrency" value={form.defaultCurrency || 'AED'} onChange={handleChange} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Address Line 1" name="addressLine1" value={form.addressLine1 || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12}><TextField fullWidth label="Address Line 2" name="addressLine2" value={form.addressLine2 || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="City" name="city" value={form.city || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="State" name="state" value={form.state || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Country" name="country" value={form.country || ''} onChange={handleChange} select>{countries.map(c => <MenuItem key={c.id} value={c.name}>{c.flagEmoji} {c.name}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Postal Code" name="postalCode" value={form.postalCode || ''} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Language" name="language" value={form.language || 'en'} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Timezone" name="timezone" value={form.timezone || 'Asia/Dubai'} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Date Format" name="dateFormat" value={form.dateFormat || 'DD/MM/YYYY'} onChange={handleChange} helperText="e.g. DD/MM/YYYY, MM/DD/YYYY" /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Time Format" name="timeFormat" value={form.timeFormat || '12h'} onChange={handleChange} helperText="12h or 24h" /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Financial Year Start" name="financialYearStart" value={form.financialYearStart || '01-01'} onChange={handleChange} helperText="MM-DD format" /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Payroll Start Month" name="payrollStartMonth" type="number" value={form.payrollStartMonth || 1} onChange={handleChange} helperText="1 = January" /></Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>Working Days</Typography>
          <WorkingDaysPicker
            value={form.companyWorkingDays || 'Mon,Tue,Wed,Thu,Fri'}
            onChange={(v) => setForm({ ...form, companyWorkingDays: v })}
            label="Select Working Days"
          />
        </Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Week Start Day" name="weekStartDay" value={form.weekStartDay || 'Monday'} onChange={handleChange} /></Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="outlined" onClick={() => SettingsApi.getGeneral().then(r => setForm(r.data.data || {}))}>Reset</Button>
      </Box>
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default GeneralSettings;
