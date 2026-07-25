import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Grid, TextField, Alert,
  CircularProgress, Card, CardContent, Divider, Avatar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import { PhotoCamera, Save, Delete as DeleteIcon } from '@mui/icons-material';
import tenantApi from '../services/tenantApi';
import { apiSuccess, apiError } from '../utils/toast';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const LEGAL_ID_TYPES = [
  { value: 'TL', label: 'TL – Commercial/Trade License' },
  { value: 'EID', label: 'EID – Emirates ID' },
  { value: 'PAS', label: 'PAS – Passport' },
  { value: 'CD', label: 'CD – Cabinet Decision' },
];

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    subdomain: '',
    currencyCode: '',
    timezone: '',
    dateFormat: '',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    currencyDecimalPlaces: '2',
    defaultPaymentTerms: 'Net 30',
    defaultTaxId: '',
    taxCalculationMethod: 'Exclusive',
    autoJournalEntry: false,
    autoPosting: false,
    allowBackdatedTransactions: false,
    trnTin: '',
    electronicIdentifier: '',
    legalRegistrationIdentifier: '',
    legalRegistrationIdentifierType: '',
  });

  const [errors, setErrors] = useState({});

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tenantApi.getMyTenant();
      const data = res.data || res;
      setProfile(data);
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postalCode: data.postalCode || '',
        subdomain: data.subdomain || '',
        currencyCode: data.currencyCode || 'AED',
        timezone: data.timezone || '+04:00',
        dateFormat: data.dateFormat || 'DD/MM/YYYY',
        fiscalYearStart: data.fiscalYearStart || '01-01',
        fiscalYearEnd: data.fiscalYearEnd || '12-31',
        currencyDecimalPlaces: data.currencyDecimalPlaces || '2',
        defaultPaymentTerms: data.defaultPaymentTerms || 'Net 30',
        defaultTaxId: data.defaultTaxId || '',
        taxCalculationMethod: data.taxCalculationMethod || 'Exclusive',
        autoJournalEntry: data.autoJournalEntry ?? false,
        autoPosting: data.autoPosting ?? false,
        allowBackdatedTransactions: data.allowBackdatedTransactions ?? false,
        trnTin: data.trnTin || '',
        electronicIdentifier: data.electronicIdentifier || '',
        legalRegistrationIdentifier: data.legalRegistrationIdentifier || '',
        legalRegistrationIdentifierType: data.legalRegistrationIdentifierType || '',
      });
      if (data.logo) {
        setLogoPreview(`/${data.logo}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await tenantApi.removeLogo();
      setLogoPreview(null);
      setLogoFile(null);
      apiSuccess('Logo removed successfully');
    } catch (err) {
      apiError(err.response?.data?.message || 'Failed to remove logo');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Company name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.trnTin.trim()) newErrors.trnTin = 'TRN/TIN is required';
    if (!form.electronicIdentifier.trim()) newErrors.electronicIdentifier = 'Electronic identifier is required';
    if (!form.legalRegistrationIdentifier.trim()) newErrors.legalRegistrationIdentifier = 'Legal registration identifier is required';
    if (!form.legalRegistrationIdentifierType) newErrors.legalRegistrationIdentifierType = 'Identifier type is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setError(null);

      // Upload logo if changed
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        await tenantApi.uploadLogo(fd);
        setLogoFile(null);
      }

      // Update profile fields
      await tenantApi.updateMyTenant(form);
      apiSuccess('Company profile updated successfully');
      await loadProfile();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update company profile';
      setError(msg);
      apiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your company information and branding
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Logo Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Company Logo
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: 100, height: 100, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {logoPreview ? (
              <Box
                component="img"
                src={logoPreview}
                alt="Company Logo"
                sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
              />
            ) : (
              <Typography variant="h4" color="white" fontWeight="bold">
                {form.name ? form.name.charAt(0).toUpperCase() : 'C'}
              </Typography>
            )}
          </Box>
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              size="small"
            >
              Upload Logo
              <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
            </Button>
            {(logoPreview || profile?.logo) && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                size="small"
                onClick={handleRemoveLogo}
                sx={{ ml: 1 }}
              >
                Remove
              </Button>
            )}
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              Recommended: 200x200px, PNG or JPG
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Company Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Company Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Company Name *"
              value={form.name}
              onChange={handleChange('name')}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Email *" type="email"
              value={form.email}
              onChange={handleChange('email')}
              required
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="TRN/TIN *"
              value={form.trnTin}
              onChange={handleChange('trnTin')}
              required
              error={!!errors.trnTin}
              helperText={errors.trnTin}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Electronic Identifier *"
              value={form.electronicIdentifier}
              onChange={handleChange('electronicIdentifier')}
              required
              error={!!errors.electronicIdentifier}
              helperText={errors.electronicIdentifier}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Legal Registration Identifier *"
              value={form.legalRegistrationIdentifier}
              onChange={handleChange('legalRegistrationIdentifier')}
              required
              error={!!errors.legalRegistrationIdentifier}
              helperText={errors.legalRegistrationIdentifier}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth size="small" label="Legal Registration Identifier Type *"
              value={form.legalRegistrationIdentifierType}
              onChange={handleChange('legalRegistrationIdentifierType')}
              required
              error={!!errors.legalRegistrationIdentifierType}
              helperText={errors.legalRegistrationIdentifierType}
            >
              <MenuItem value="">-- Select Type --</MenuItem>
              {LEGAL_ID_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Phone"
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Subdomain"
              value={form.subdomain}
              onChange={handleChange('subdomain')}
              helperText="Your unique URL identifier"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth size="small" label="Address *" multiline rows={2}
              value={form.address}
              onChange={handleChange('address')}
              required
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" label="City *"
              value={form.city}
              onChange={handleChange('city')}
              required
              error={!!errors.city}
              helperText={errors.city}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" label="State *"
              value={form.state}
              onChange={handleChange('state')}
              required
              error={!!errors.state}
              helperText={errors.state}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" label="Country *"
              value={form.country}
              onChange={handleChange('country')}
              required
              error={!!errors.country}
              helperText={errors.country}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="Postal Code"
              value={form.postalCode}
              onChange={handleChange('postalCode')}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Localization */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Localization
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Currency" value={form.currencyCode}
              onChange={handleChange('currencyCode')} helperText="e.g. AED, USD, SAR" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Timezone" value={form.timezone}
              onChange={handleChange('timezone')} helperText="e.g. +04:00, UTC" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Date Format" value={form.dateFormat}
              onChange={handleChange('dateFormat')} helperText="e.g. DD/MM/YYYY" />
          </Grid>
        </Grid>
      </Paper>

      {/* Fiscal Year */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Fiscal Year
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the start and end month for your company's fiscal year. The dashboard revenue chart will display data for the 12 months of the fiscal year.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year Start Month"
              value={form.fiscalYearStart ? form.fiscalYearStart.split('-')[0] : '01'}
              onChange={(e) => {
                const day = (form.fiscalYearStart || '01-01').split('-')[1] || '01';
                setForm(prev => ({ ...prev, fiscalYearStart: `${e.target.value}-${day}` }));
              }}
            >
              {MONTHS.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year Start Day"
              value={form.fiscalYearStart ? form.fiscalYearStart.split('-')[1] : '01'}
              onChange={(e) => {
                const month = (form.fiscalYearStart || '01-01').split('-')[0] || '01';
                setForm(prev => ({ ...prev, fiscalYearStart: `${month}-${e.target.value}` }));
              }}
            >
              {Array.from({ length: 31 }, (_, i) => {
                const val = String(i + 1).padStart(2, '0');
                return <MenuItem key={val} value={val}>{val}</MenuItem>;
              })}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year End Month"
              value={form.fiscalYearEnd ? form.fiscalYearEnd.split('-')[0] : '12'}
              onChange={(e) => {
                const day = (form.fiscalYearEnd || '12-31').split('-')[1] || '31';
                setForm(prev => ({ ...prev, fiscalYearEnd: `${e.target.value}-${day}` }));
              }}
            >
              {MONTHS.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fiscal Year End Day"
              value={form.fiscalYearEnd ? form.fiscalYearEnd.split('-')[1] : '31'}
              onChange={(e) => {
                const month = (form.fiscalYearEnd || '12-31').split('-')[0] || '12';
                setForm(prev => ({ ...prev, fiscalYearEnd: `${month}-${e.target.value}` }));
              }}
            >
              {Array.from({ length: 31 }, (_, i) => {
                const val = String(i + 1).padStart(2, '0');
                return <MenuItem key={val} value={val}>{val}</MenuItem>;
              })}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Financial Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              select fullWidth size="small" label="Currency Decimal Places"
              value={form.currencyDecimalPlaces}
              onChange={handleChange('currencyDecimalPlaces')}
            >
              {['0', '1', '2', '3', '4'].map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select fullWidth size="small" label="Default Payment Terms"
              value={form.defaultPaymentTerms}
              onChange={handleChange('defaultPaymentTerms')}
            >
              {['Immediate', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'].map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select fullWidth size="small" label="Tax Calculation Method"
              value={form.taxCalculationMethod}
              onChange={handleChange('taxCalculationMethod')}
            >
              <MenuItem value="Exclusive">Exclusive</MenuItem>
              <MenuItem value="Inclusive">Inclusive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={<Switch checked={!!form.autoJournalEntry} onChange={(e) => setForm(prev => ({ ...prev, autoJournalEntry: e.target.checked }))} />}
              label={<Typography variant="body2">Auto Journal Entry</Typography>}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={<Switch checked={!!form.autoPosting} onChange={(e) => setForm(prev => ({ ...prev, autoPosting: e.target.checked }))} />}
              label={<Typography variant="body2">Auto Posting</Typography>}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={<Switch checked={!!form.allowBackdatedTransactions} onChange={(e) => setForm(prev => ({ ...prev, allowBackdatedTransactions: e.target.checked }))} />}
              label={<Typography variant="body2">Allow Backdated Transactions</Typography>}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={loadProfile} disabled={saving}>
          Reset
        </Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyProfile;
