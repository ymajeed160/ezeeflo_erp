import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Paper, Chip, CircularProgress, Alert,
  Divider, IconButton, Stack, Card, CardContent,
} from '@mui/material';
import { ArrowBack, Edit, Business, Email, Phone, Language, LocationOn } from '@mui/icons-material';
import { getCompany, changeCompanyStatus } from '../../services/superAdminCompanyService';

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  suspended: { color: 'warning', label: 'Suspended' },
  expired: { color: 'error', label: 'Expired' },
  pending_activation: { color: 'info', label: 'Pending Activation' },
  archived: { color: 'secondary', label: 'Archived' },
};

const CompanyView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await getCompany(id);
        setData(result);
      } catch (err) { setError('Failed to load company'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      await changeCompanyStatus(id, newStatus);
      const result = await getCompany(id);
      setData(result);
    } catch { setError('Failed to change status'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const c = data.company;
  const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.inactive;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/superadmin/companies')}><ArrowBack /></IconButton>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1 }}>{c.name}</Typography>
        <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/superadmin/companies/${c.id}/edit`)}>
          Edit Company
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Company Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Company Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Legal Name</Typography><Typography fontWeight={500}>{c.legalName || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Trade License</Typography><Typography fontWeight={500}>{c.tradeLicenseNumber || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Tax Registration</Typography><Typography fontWeight={500}>{c.taxRegistrationNumber || '-'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Status</Typography><Chip label={s.label} color={s.color} size="small" /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={1}>
              <Grid item xs={12}><Stack direction="row" spacing={1} alignItems="center"><Email fontSize="small" color="action" /><Typography variant="body2">{c.email || '-'}</Typography></Stack></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1} alignItems="center"><Phone fontSize="small" color="action" /><Typography variant="body2">{c.phone || '-'}</Typography></Stack></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1} alignItems="center"><Language fontSize="small" color="action" /><Typography variant="body2">{c.website || '-'}</Typography></Stack></Grid>
              <Grid item xs={12}><Stack direction="row" spacing={1} alignItems="center"><LocationOn fontSize="small" color="action" /><Typography variant="body2">{[c.address, c.city, c.country].filter(Boolean).join(', ') || '-'}</Typography></Stack></Grid>
            </Grid>
          </Paper>

          {/* Configuration */}
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Time Zone</Typography><Typography>{c.timezone || '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Currency</Typography><Typography>{c.currency || '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Language</Typography><Typography>{c.language || '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Working Days</Typography><Typography>{c.workingDays || '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Financial Year</Typography><Typography>{c.financialYearStart || '-'}</Typography></Grid>
            </Grid>
          </Paper>

          {/* Limits */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Limits & Subscription</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Plan</Typography><Chip label={c.subscriptionPlan || 'starter'} size="small" color="primary" /></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Start Date</Typography><Typography>{c.subscriptionStartDate ? new Date(c.subscriptionStartDate).toLocaleDateString() : '-'}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" color="text.secondary">Expiry Date</Typography><Typography color={new Date(c.subscriptionExpiryDate) < new Date() ? 'error.main' : 'inherit'} fontWeight={600}>{c.subscriptionExpiryDate ? new Date(c.subscriptionExpiryDate).toLocaleDateString() : '-'}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" color="text.secondary">Max Employees</Typography><Typography fontWeight={600}>{c.maxEmployees}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" color="text.secondary">Max Users</Typography><Typography fontWeight={600}>{c.maxUsers}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" color="text.secondary">Storage (MB)</Typography><Typography fontWeight={600}>{c.storageLimitMb}</Typography></Grid>
              <Grid item xs={3}><Typography variant="body2" color="text.secondary">Grace Period</Typography><Typography fontWeight={600}>{c.gracePeriodDays} days</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar - Status & Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Status Actions</Typography>
              <Stack spacing={1}>
                <Button fullWidth variant="contained" color="success" disabled={c.status === 'active' || actionLoading} onClick={() => handleStatusChange('active')}>Activate</Button>
                <Button fullWidth variant="outlined" color="warning" disabled={c.status === 'inactive' || actionLoading} onClick={() => handleStatusChange('inactive')}>Deactivate</Button>
                <Button fullWidth variant="outlined" color="error" disabled={c.status === 'suspended' || actionLoading} onClick={() => handleStatusChange('suspended')}>Suspend</Button>
                <Button fullWidth variant="outlined" color="secondary" disabled={c.status === 'archived' || actionLoading} onClick={() => handleStatusChange('archived')}>Archive</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Company Admin</Typography>
              {data.admin ? (
                <Box>
                  <Typography fontWeight={600}>{data.admin.firstName} {data.admin.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{data.admin.email}</Typography>
                  <Typography variant="body2" color="text.secondary">@{data.admin.username}</Typography>
                  <Chip label={data.admin.isActive ? 'Active' : 'Inactive'} color={data.admin.isActive ? 'success' : 'default'} size="small" sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No admin assigned</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyView;
