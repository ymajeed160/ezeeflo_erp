import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Paper,
  CircularProgress, Button, Divider,
} from '@mui/material';
import {
  CardMembership as PlanIcon,
  Extension as ModuleIcon,
  People as SubscriptionIcon,
  TrendingUp, AttachMoney, CheckCircle, Business, Person, Warning,
  Home, Dashboard,
} from '@mui/icons-material';
import SuperAdminLayout from '../../components/Layout/SuperAdminLayout';
import { fetchDashboardStats } from '../../store/slices/companySubscriptionSlice';
import { fetchPlans } from '../../store/slices/subscriptionPlanSlice';
import { fetchModules } from '../../store/slices/subscriptionModuleSlice';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card
    sx={{
      borderRadius: 3,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}.main, ${color}.dark)`,
        color: '#fff',
        boxShadow: `0 4px 12px ${color}.main`,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const MiniStat = ({ label, value, color }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.5, borderRadius: 2.5, textAlign: 'center',
      transition: 'all 0.2s ease',
      borderColor: `${color}30`,
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
    }}
  >
    <Typography variant="h4" fontWeight={800} color={color || 'text.primary'}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
  </Paper>
);

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboardStats, loading } = useSelector((state) => state.companySubscriptions);
  const plans = useSelector((state) => state.subscriptionPlans.items);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchPlans({ limit: 1 }));
    dispatch(fetchModules({ limit: 1 }));
  }, [dispatch]);

  if (loading && !dashboardStats) {
    return (
      <SuperAdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </SuperAdminLayout>
    );
  }

  const stats = dashboardStats || {};

  return (
    <SuperAdminLayout>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Dashboard sx={{ fontSize: 32 }} />
            Super Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor subscriptions, plans, modules, and platform-wide metrics
          </Typography>
        </Box>

        {/* ─── Key Metrics ─── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Companies"
              value={stats.totalCompanies || 0}
              icon={<Business sx={{ fontSize: 28 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={stats.totalActiveUsers || 0}
              icon={<Person sx={{ fontSize: 28 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions || 0}
              icon={<SubscriptionIcon sx={{ fontSize: 28 }} />}
              color="info"
              onClick={() => navigate('/superadmin/subscriptions')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Plans"
              value={plans.length > 0 ? (stats.totalPlans || plans.length) : (stats.totalCustomers || 0)}
              icon={<PlanIcon sx={{ fontSize: 28 }} />}
              color="warning"
              onClick={() => navigate('/superadmin/plans')}
            />
          </Grid>
        </Grid>

        {/* ─── Main Content Grid ─── */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={4}>
            {/* Quick Actions */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Home sx={{ fontSize: 22 }} />
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlanIcon />}
                    onClick={() => navigate('/superadmin/plans')}
                    sx={{ borderRadius: 2, py: 1.3, textTransform: 'none', fontWeight: 600 }}
                  >
                    Manage Plans
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    color="secondary"
                    startIcon={<ModuleIcon />}
                    onClick={() => navigate('/superadmin/modules')}
                    sx={{ borderRadius: 2, py: 1.3, textTransform: 'none', fontWeight: 600 }}
                  >
                    Manage Modules
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    color="info"
                    startIcon={<SubscriptionIcon />}
                    onClick={() => navigate('/superadmin/subscriptions')}
                    sx={{ borderRadius: 2, py: 1.3, textTransform: 'none', fontWeight: 600 }}
                  >
                    View Subscriptions
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card sx={{ borderRadius: 3, mt: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 22, color: 'success.main' }} />
                  System Health
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Database</Typography>
                      <Typography variant="caption" color="text.secondary">{stats.dbStatus || 'Healthy'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <TrendingUp sx={{ color: 'info.main', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>New Registrations (30d)</Typography>
                      <Typography variant="caption" color="text.secondary">{stats.recentRegistrations || 0} companies</Typography>
                    </Box>
                  </Box>
                  {stats.mostUsedModule && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <ModuleIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Top Module</Typography>
                        <Typography variant="caption" color="text.secondary">{stats.mostUsedModule}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={8}>
            {/* Subscription Overview */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SubscriptionIcon sx={{ fontSize: 22 }} />
                  Subscription Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <MiniStat label="Active" value={stats.activeSubscriptions || 0} color="success.main" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MiniStat label="On Trial" value={stats.trialCompanies || 0} color="info.main" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MiniStat label="Expired" value={stats.expiredSubscriptions || 0} color="error.main" />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MiniStat label="Inactive" value={stats.inactiveCompanies || 0} color="warning.main" />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card sx={{ borderRadius: 3, mt: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 22, color: 'success.main' }} />
                  Revenue Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5, borderRadius: 2.5, textAlign: 'center',
                        borderColor: 'success.light',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="h5" fontWeight={800} color="success.main">
                        ${parseFloat(stats.monthlyRevenue || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Monthly Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5, borderRadius: 2.5, textAlign: 'center',
                        borderColor: 'primary.light',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h5" fontWeight={800} color="primary.main">
                        ${parseFloat(stats.annualRevenue || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Annual Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5, borderRadius: 2.5, textAlign: 'center',
                        borderColor: 'warning.light',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <Warning sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h5" fontWeight={800} color="warning.main">
                        {stats.pendingPayments || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Pending Invoices</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5, borderRadius: 2.5, textAlign: 'center',
                        borderColor: 'secondary.light',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <ModuleIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                      <Typography variant="h5" fontWeight={800} color="secondary.main">
                        {stats.modulesSold || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Modules Sold</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
