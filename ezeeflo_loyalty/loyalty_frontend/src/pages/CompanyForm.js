import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Card, CardContent, CircularProgress,
  MenuItem, IconButton,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import companyApi from '../services/companyApi';
import { showSuccess, showError } from '../utils/toast';

const defaultForm = {
  name: '', code: '', email: '', phone: '', website: '',
  country: 'UAE', currency: 'AED', timezone: 'Asia/Dubai',
  city: '', state: '', addressLine1: '',
  adminUsername: '', adminEmail: '', adminPassword: '',
};

const CompanyForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      companyApi.getById(id)
        .then(({ data }) => setForm({ ...defaultForm, ...data.data }))
        .catch(() => showError('Failed to load company'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await companyApi.update(id, form);
        showSuccess('Company updated');
      } else {
        await companyApi.create(form);
        showSuccess('Company created');
      }
      navigate('/superadmin/companies');
    } catch (err) {
      showError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/superadmin/companies')}><ArrowBack /></IconButton>
        <Typography variant="h5">{isEdit ? 'Edit Company' : 'New Company'}</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" sx={{ mb: 2 }}>Company Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Company Name *" value={form.name} onChange={handleChange('name')} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Company Code *" value={form.code} onChange={handleChange('code')} required
                  helperText="Uppercase, no spaces (e.g. ACME)" disabled={isEdit} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Website" value={form.website} onChange={handleChange('website')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Country" value={form.country} onChange={handleChange('country')}>
                  <MenuItem value="UAE">UAE</MenuItem>
                  <MenuItem value="SA">Saudi Arabia</MenuItem>
                  <MenuItem value="QA">Qatar</MenuItem>
                  <MenuItem value="KW">Kuwait</MenuItem>
                  <MenuItem value="OM">Oman</MenuItem>
                  <MenuItem value="BH">Bahrain</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Currency" value={form.currency} onChange={handleChange('currency')}>
                  <MenuItem value="AED">AED (د.إ)</MenuItem>
                  <MenuItem value="SAR">SAR (﷼)</MenuItem>
                  <MenuItem value="QAR">QAR</MenuItem>
                  <MenuItem value="USD">USD ($)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="City" value={form.city} onChange={handleChange('city')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="State/Province" value={form.state} onChange={handleChange('state')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" value={form.addressLine1} onChange={handleChange('addressLine1')} />
              </Grid>
            </Grid>

            {!isEdit && (
              <>
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Admin Account</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Admin Username" value={form.adminUsername} onChange={handleChange('adminUsername')}
                      helperText="Default: admin_[code]" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Admin Email" type="email" value={form.adminEmail} onChange={handleChange('adminEmail')} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Admin Password" type="password" value={form.adminPassword} onChange={handleChange('adminPassword')}
                      helperText="Default: Admin@123" />
                  </Grid>
                </Grid>
              </>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading} size="large">
                {loading ? <CircularProgress size={20} /> : isEdit ? 'Update Company' : 'Create Company'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/superadmin/companies')}>Cancel</Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanyForm;
