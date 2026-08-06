import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Button } from '@mui/material';
import {
  Business, Group, ShoppingCart, TrendingUp, CheckCircle, Timer,
} from '@mui/icons-material';
import dashboardApi from '../services/dashboardApi';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>{value?.toLocaleString() || 0}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardApi.getSuperAdminStats();
        setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5">Super Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Platform overview and management</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/superadmin/companies/new')}>
          Add Company
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Companies" value={stats?.totalCompanies} icon={<Business />} color="#4F46E5" onClick={() => navigate('/superadmin/companies')} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Active Companies" value={stats?.activeCompanies} icon={<CheckCircle />} color="#10B981" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Trial Companies" value={stats?.trialCompanies} icon={<Timer />} color="#F59E0B" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Users" value={stats?.totalUsers} icon={<Group />} color="#8B5CF6" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Active Plans" value={stats?.totalPlans} icon={<ShoppingCart />} color="#06B6D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Monthly Revenue" value={`AED ${(stats?.revenue?.monthly || 0).toLocaleString()}`} icon={<TrendingUp />} color="#EF4444" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;
