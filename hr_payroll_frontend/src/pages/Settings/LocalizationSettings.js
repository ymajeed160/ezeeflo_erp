import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Alert, Snackbar, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Switch } from '@mui/material';
import SettingsApi from '../../services/settingsApi';

const countries = [
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' }, { code: 'OM', name: 'Oman' },
  { code: 'BH', name: 'Bahrain' }, { code: 'KW', name: 'Kuwait' },
];

const LocalizationSettings = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    SettingsApi.getLocalization().then(r => setForm(r.data.data || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    setSaving(true);
    try { await SettingsApi.updateLocalization(form); setMsg({ type: 'success', text: 'Saved' }); }
    catch { setMsg({ type: 'error', text: 'Failed' }); }
    setSaving(false);
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Localization</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure language, currency, date formats, and country-specific rules.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select name="country" value={form.country || 'AE'} label="Country" onChange={handleChange}>
              {countries.map(c => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Language" name="language" value={form.language || 'en'} onChange={handleChange} helperText="en, ar, etc." /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Currency Code" name="currency" value={form.currency || 'AED'} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Currency Symbol" name="currencySymbol" value={form.currencySymbol || 'د.إ'} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Timezone" name="timezone" value={form.timezone || 'Asia/Dubai'} onChange={handleChange} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Date Format" name="dateFormat" value={form.dateFormat || 'DD/MM/YYYY'} onChange={handleChange} helperText="DD/MM/YYYY, MM/DD/YYYY" /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Number Format" name="numberFormat" value={form.numberFormat || '#,###.##'} onChange={handleChange} helperText="#,###.## or #.###,##" /></Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={form.regionalHolidaysEnabled !== false} onChange={e => setForm({ ...form, regionalHolidaysEnabled: e.target.checked })} />}
            label="Enable Regional Holidays"
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </Box>
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LocalizationSettings;
