import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Chip } from '@mui/material';
import {
  People, Loyalty, Redeem, TrendingUp, PersonAdd, Star, Diamond,
} from '@mui/icons-material';
import dashboardApi from '../services/dashboardApi';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 52, height: 52, borderRadius: 2.5, background: `linear-gradient(135deg, ${color}20, ${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 26 } })}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>{value?.toLocaleString() || 0}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardApi.getStats();
        setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
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
      {/* Branded Header */}
      <Box sx={{ mb: 2.5, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: 2.5, p: 2.5, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.1 }}>
          <Diamond sx={{ fontSize: 120 }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Diamond sx={{ fontSize: 20 }} />
            <Chip label="LOYALTY PLATFORM" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, letterSpacing: 1, fontSize: '0.6rem', height: 22 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, letterSpacing: '-0.5px', fontSize: '1.75rem' }}>
            EzeeFlo Loyalty
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 500 }}>
            Welcome back, <strong>{user?.firstName}</strong>! Here's a live overview of your loyalty program performance.
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ mt: 1, opacity: 0.8 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Customers" value={stats?.totalCustomers} icon={<People />} color="#4F46E5" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Active Members" value={stats?.activeMembers} icon={<Star />} color="#F59E0B" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Points Issued" value={stats?.totalPointsIssued} icon={<Loyalty />} color="#10B981" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Points Redeemed" value={stats?.totalPointsRedeemed} icon={<Redeem />} color="#EF4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="New This Month" value={stats?.customersThisMonth} icon={<PersonAdd />} color="#8B5CF6" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Points This Month" value={stats?.pointsThisMonth} icon={<TrendingUp />} color="#06B6D4" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
