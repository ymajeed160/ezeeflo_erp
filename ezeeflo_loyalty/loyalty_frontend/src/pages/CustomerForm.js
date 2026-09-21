import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Card, CardContent, CircularProgress,
  MenuItem, IconButton, Chip, Autocomplete,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import customerApi from '../services/customerApi';
import { showSuccess, showError } from '../utils/toast';

const defaultForm = {
  firstName: '', lastName: '', email: '', phone: '', mobile: '',
  dateOfBirth: '', gender: '', segment: '', source: '', tags: [],
  addressLine1: '', city: '', state: '', country: 'UAE', postalCode: '',
  nationalId: '', notes: '',
};

const CustomerForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);

  useEffect(() => {
    customerApi.getTags().then(({ data }) => setTagOptions(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      customerApi.getById(id)
        .then(({ data }) => {
          const c = data.data;
          setForm({
            ...defaultForm,
            ...c,
            dateOfBirth: c.dateOfBirth ? c.dateOfBirth.substring(0, 10) : '',
            tags: Array.isArray(c.tags) ? c.tags : (typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : []),
          });
        })
        .catch(() => showError('Failed to load customer'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone) { showError('Phone number is required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await customerApi.update(id, form);
        showSuccess('Customer updated');
      } else {
        await customerApi.create(form);
        showSuccess('Customer created with loyalty account');
      }
      navigate('/customers');
    } catch (err) {
      showError(err.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  if (fetching) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}><ArrowBack /></IconButton>
        <Typography variant="h5">{isEdit ? 'Edit Customer' : 'New Customer'}</Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="First Name *" value={form.firstName} onChange={handleChange('firstName')} required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Last Name" value={form.lastName} onChange={handleChange('lastName')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Phone *" value={form.phone} onChange={handleChange('phone')} required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Mobile" value={form.mobile} onChange={handleChange('mobile')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth select label="Gender" value={form.gender} onChange={handleChange('gender')}>
                      <MenuItem value="">Not Specified</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="National ID / Emirates ID" value={form.nationalId} onChange={handleChange('nationalId')} />
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Address</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address Line 1" value={form.addressLine1} onChange={handleChange('addressLine1')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="City" value={form.city} onChange={handleChange('city')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="State/Province" value={form.state} onChange={handleChange('state')} />
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
                    <TextField fullWidth label="Postal Code" value={form.postalCode} onChange={handleChange('postalCode')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Side Panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Segmentation</Typography>
                <TextField fullWidth select label="Segment" value={form.segment} onChange={handleChange('segment')} sx={{ mb: 2 }}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="At Risk">At Risk</MenuItem>
                  <MenuItem value="Loyal">Loyal</MenuItem>
                </TextField>
                <TextField fullWidth select label="Source" value={form.source} onChange={handleChange('source')} sx={{ mb: 2 }}>
                  <MenuItem value="">Unknown</MenuItem>
                  <MenuItem value="in_store">In Store</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="import">Import</MenuItem>
                </TextField>
                <Autocomplete
                  multiple freeSolo
                  options={tagOptions}
                  value={form.tags || []}
                  onChange={(_, val) => setForm({ ...form, tags: val })}
                  renderTags={(val, getTagProps) => val.map((option, index) => (
                    <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))}
                  renderInput={(params) => <TextField {...params} label="Tags" size="small" />}
                  size="small"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                <TextField fullWidth multiline rows={4} label="Notes" value={form.notes} onChange={handleChange('notes')} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading} size="large">
            {loading ? <CircularProgress size={20} /> : isEdit ? 'Update Customer' : 'Create Customer'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/customers')}>Cancel</Button>
        </Box>
      </form>
    </Box>
  );
};

export default CustomerForm;
