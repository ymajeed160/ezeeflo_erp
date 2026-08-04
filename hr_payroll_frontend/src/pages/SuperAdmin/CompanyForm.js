import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Paper, Alert, CircularProgress,
  IconButton, Divider,
} from '@mui/material';
import { ArrowBack, Save, Business, PersonAdd } from '@mui/icons-material';
import { createCompany, updateCompany, getCompany } from '../../services/superAdminCompanyService';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending_activation', label: 'Pending Activation' },
];

const PLAN_OPTIONS = ['starter', 'professional', 'enterprise', 'custom'];
const CURRENCY_OPTIONS = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];
const TIMEZONE_OPTIONS = ['Asia/Dubai', 'Asia/Riyadh', 'Asia/Doha', 'Asia/Muscat', 'Asia/Kolkata', 'Europe/London', 'America/New_York'];

const CompanyForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const accessToken = useSelector((s) => s.superAdminAuth?.accessToken);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', legalName: '', tradeLicenseNumber: '', taxRegistrationNumber: '',
    country: '', city: '', address: '', phone: '', email: '', website: '', logoUrl: '',
    timezone: 'Asia/Dubai', currency: 'AED', language: 'en',
    workingDays: 'Mon,Tue,Wed,Thu,Fri', financialYearStart: '01-01',
    status: 'pending_activation', subscriptionPlan: 'starter',
    subscriptionStartDate: '', subscriptionExpiryDate: '',
    maxEmployees: 50, maxUsers: 10, maxBranches: 5, maxDepartments: 10,
    maxPayrollRuns: 12, storageLimitMb: 1024, maxApiRequests: 10000,
    gracePeriodDays: 15, notes: '',
    // Admin fields
    adminFirstName: '', adminLastName: '', adminUsername: '', adminEmail: '',
    adminPhone: '', adminPassword: '',
  });

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          setLoading(true);
          const result = await getCompany(id);
          const c = result.company;
          setForm(prev => ({
            ...prev,
            name: c.name || '', legalName: c.legalName || '', tradeLicenseNumber: c.tradeLicenseNumber || '',
            taxRegistrationNumber: c.taxRegistrationNumber || '', country: c.country || '', city: c.city || '',
            address: c.address || '', phone: c.phone || '', email: c.email || '', website: c.website || '',
            logoUrl: c.logoUrl || '', timezone: c.timezone || 'Asia/Dubai', currency: c.currency || 'AED',
            language: c.language || 'en', workingDays: c.workingDays || 'Mon,Tue,Wed,Thu,Fri',
            financialYearStart: c.financialYearStart || '01-01', status: c.status || 'pending_activation',
            subscriptionPlan: c.subscriptionPlan || 'starter',
            subscriptionStartDate: c.subscriptionStartDate ? c.subscriptionStartDate.slice(0, 10) : '',
            subscriptionExpiryDate: c.subscriptionExpiryDate ? c.subscriptionExpiryDate.slice(0, 10) : '',
            maxEmployees: c.maxEmployees || 50, maxUsers: c.maxUsers || 10,
            maxBranches: c.maxBranches || 5, maxDepartments: c.maxDepartments || 10,
            maxPayrollRuns: c.maxPayrollRuns || 12, storageLimitMb: c.storageLimitMb || 1024,
            maxApiRequests: c.maxApiRequests || 10000, gracePeriodDays: c.gracePeriodDays || 15,
            notes: c.notes || '',
          }));
        } catch (err) { setError('Failed to load company'); }
        finally { setLoading(false); }
      })();
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form };
      // Convert numeric fields
      ['maxEmployees', 'maxUsers', 'maxBranches', 'maxDepartments', 'maxPayrollRuns', 'storageLimitMb', 'maxApiRequests', 'gracePeriodDays'].forEach(k => {
        payload[k] = parseInt(payload[k], 10) || 0;
      });
      if (isEdit) {
        await updateCompany(id, payload);
        setSuccess('Company updated successfully');
      } else {
        await createCompany(payload);
        setSuccess('Company created successfully');
        setTimeout(() => navigate('/superadmin/companies'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company');
    } finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/superadmin/companies')}><ArrowBack /></IconButton>
        <Typography variant="h4" fontWeight={700}>
          {isEdit ? 'Edit Company' : 'Create Company'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Company Information */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} /> Company Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Company Name *" value={form.name} onChange={handleChange('name')} required /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Legal Name" value={form.legalName} onChange={handleChange('legalName')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Trade License Number" value={form.tradeLicenseNumber} onChange={handleChange('tradeLicenseNumber')} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Tax Registration Number" value={form.taxRegistrationNumber} onChange={handleChange('taxRegistrationNumber')} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Country" value={form.country} onChange={handleChange('country')} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="City" value={form.city} onChange={handleChange('city')} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={handleChange('address')} multiline rows={2} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email} onChange={handleChange('email')} type="email" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Website" value={form.website} onChange={handleChange('website')} /></Grid>
        </Grid>
      </Paper>

      {/* Configuration */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Configuration</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}><TextField select fullWidth label="Time Zone" value={form.timezone} onChange={handleChange('timezone')}>{TIMEZONE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} sm={3}><TextField select fullWidth label="Currency" value={form.currency} onChange={handleChange('currency')}>{CURRENCY_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="Language" value={form.language} onChange={handleChange('language')} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="Financial Year Start" value={form.financialYearStart} onChange={handleChange('financialYearStart')} placeholder="MM-DD" /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Working Days" value={form.workingDays} onChange={handleChange('workingDays')} /></Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Status" value={form.status} onChange={handleChange('status')}>
              {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Subscription Plan" value={form.subscriptionPlan} onChange={handleChange('subscriptionPlan')}>
              {PLAN_OPTIONS.map(p => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Subscription Start" value={form.subscriptionStartDate} onChange={handleChange('subscriptionStartDate')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Subscription Expiry" value={form.subscriptionExpiryDate} onChange={handleChange('subscriptionExpiryDate')} InputLabelProps={{ shrink: true }} /></Grid>
        </Grid>
      </Paper>

      {/* Limits */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Company Limits</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max Employees" type="number" value={form.maxEmployees} onChange={handleChange('maxEmployees')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max Users" type="number" value={form.maxUsers} onChange={handleChange('maxUsers')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max Branches" type="number" value={form.maxBranches} onChange={handleChange('maxBranches')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max Departments" type="number" value={form.maxDepartments} onChange={handleChange('maxDepartments')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max Payroll Runs" type="number" value={form.maxPayrollRuns} onChange={handleChange('maxPayrollRuns')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Storage Limit (MB)" type="number" value={form.storageLimitMb} onChange={handleChange('storageLimitMb')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Max API Requests" type="number" value={form.maxApiRequests} onChange={handleChange('maxApiRequests')} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Grace Period (Days)" type="number" value={form.gracePeriodDays} onChange={handleChange('gracePeriodDays')} /></Grid>
        </Grid>
      </Paper>

      {/* Company Admin (only on create) */}
      {!isEdit && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '2px solid', borderColor: 'primary.light' }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            <PersonAdd sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} /> Company Administrator
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A Company Admin account will be created automatically with this company.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="First Name *" value={form.adminFirstName} onChange={handleChange('adminFirstName')} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name *" value={form.adminLastName} onChange={handleChange('adminLastName')} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email *" value={form.adminEmail} onChange={handleChange('adminEmail')} type="email" required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Username" value={form.adminUsername} onChange={handleChange('adminUsername')} helperText="Auto-generated if empty" /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.adminPhone} onChange={handleChange('adminPhone')} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Temporary Password" value={form.adminPassword} onChange={handleChange('adminPassword')} type="password" helperText="Default: Welcome@123 if empty" /></Grid>
          </Grid>
        </Paper>
      )}

      {/* Notes */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <TextField fullWidth label="Notes" value={form.notes} onChange={handleChange('notes')} multiline rows={3} />
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => navigate('/superadmin/companies')}>Cancel</Button>
        <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : isEdit ? 'Update Company' : 'Create Company'}
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyForm;
