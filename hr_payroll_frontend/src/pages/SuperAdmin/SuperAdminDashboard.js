import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Chip,
  Paper, Stack, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider,
} from '@mui/material';
import {
  Business, People, Subscriptions, Login, Warning,
  Group, AdminPanelSettings, Badge, TrendingUp, AttachMoney,
  CheckCircle, Cancel, Block, AccessTime, Archive,
} from '@mui/icons-material';
import { getDashboard } from '../../services/superAdminService';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{
    height: '100%',
    borderRadius: 2,
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
  }}>
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 48, height: 48 }}>
          {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const StatusChip = ({ status }) => {
  const config = {
    active: { color: 'success', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Active' },
    inactive: { color: 'default', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Inactive' },
    suspended: { color: 'warning', icon: <Block sx={{ fontSize: 14 }} />, label: 'Suspended' },
    expired: { color: 'error', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Expired' },
    pending_activation: { color: 'info', icon: <AccessTime sx={{ fontSize: 14 }} />, label: 'Pending' },
    archived: { color: 'secondary', icon: <Archive sx={{ fontSize: 14 }} />, label: 'Archived' },
  };
  const c = config[status] || config.inactive;
  return <Chip icon={c.icon} label={c.label} color={c.color} size="small" variant="outlined" />;
};

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accessToken = useSelector((state) => state.superAdminAuth?.accessToken);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const result = await getDashboard(accessToken);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchDashboard();
  }, [accessToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const { companies, users, subscriptions, activity } = data;

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Super Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of all companies, users, and system activity
        </Typography>
      </Box>

      {/* Company Statistics */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
        Company Statistics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Total Companies" value={companies.total} icon={<Business />} color="primary" />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Active" value={companies.active} icon={<CheckCircle />} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Inactive" value={companies.inactive} icon={<Cancel />} color="default" />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Suspended" value={companies.suspended} icon={<Block />} color="warning" />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Expired" value={companies.expired} icon={<Cancel />} color="error" />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard title="Pending" value={companies.pendingActivation} icon={<AccessTime />} color="info" />
        </Grid>
      </Grid>

      {/* Expiring Soon Alert */}
      {companies.expiringSoon > 0 && (
        <Paper sx={{ p: 2, mb: 4, bgcolor: 'warning.light', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Warning color="warning" />
            <Typography fontWeight={600}>
              {companies.expiringSoon} company subscription(s) expiring within 30 days
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* User Statistics */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        <People sx={{ mr: 1, verticalAlign: 'middle' }} />
        User Statistics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Total Users" value={users.totalUsers} icon={<People />} color="primary" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Employees" value={users.totalEmployees} icon={<Badge />} color="info" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Company Admins" value={users.totalCompanyAdmins} icon={<AdminPanelSettings />} color="secondary" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="HR Users" value={users.totalHRUsers} icon={<Group />} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Payroll Users" value={users.totalPayrollUsers} icon={<AttachMoney />} color="warning" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Super Admins" value={users.totalSuperAdmins} icon={<AdminPanelSettings />} color="error" />
        </Grid>
      </Grid>

      {/* Subscriptions & Activity */}
      <Grid container spacing={3}>
        {/* Subscriptions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <Subscriptions sx={{ mr: 1, verticalAlign: 'middle' }} />
                Subscriptions
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Active Subscriptions</Typography>
                  <Chip
                    icon={<CheckCircle />}
                    label={subscriptions.active}
                    color="success"
                    variant="outlined"
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Expired Subscriptions</Typography>
                  <Chip
                    icon={<Cancel />}
                    label={subscriptions.expired}
                    color="error"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Activity
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 1 }}>
                <Chip
                  icon={<Login />}
                  label={`${activity.todayLogins} logins today`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              {activity.recentActivity && activity.recentActivity.length > 0 ? (
                <List dense>
                  {activity.recentActivity.slice(0, 5).map((item, idx) => (
                    <React.Fragment key={item.id || idx}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                            <AdminPanelSettings sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.description || item.action}
                          secondary={item.superAdmin?.username || 'System'}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </ListItem>
                      {idx < Math.min(activity.recentActivity.length, 5) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;
